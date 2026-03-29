// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAMAccessControl
 * @author Team 18 - CSE 540, Arizona State University (2025SpringB)
 * @notice This contract enforces role-based and credential-gated access control
 *         for resources in the Decentralized IAM dApp. Resource owners can define
 *         access policies, grant or revoke roles to DID holders, and require
 *         valid credentials as a condition for access.
 *
 * @dev Access is governed by two complementary mechanisms:
 *      1. Role-Based Access Control (RBAC): Resource owners assign named roles
 *         (e.g., "ADMIN", "VIEWER", "EDITOR") to DID holder addresses.
 *      2. Credential-Gated Access: Resource owners can require a specific
 *         credential type as a prerequisite for accessing a resource. The
 *         CredentialIssuer contract is queried to verify credential validity.
 *
 *      The DIDRegistry is checked to ensure only active DID holders can be granted roles.
 *
 * Design Pattern: RBAC + Credential verification, inspired by OpenZeppelin AccessControl.
 */

/**
 * @dev Minimal interface to DIDRegistry for active DID checks.
 */
interface IDIDRegistry {
    function isActiveDID(address _owner) external view returns (bool);
}

/**
 * @dev Minimal interface to CredentialIssuer for on-chain credential verification.
 */
interface ICredentialIssuer {
    struct Credential {
        uint256 credentialId;
        address issuer;
        address subject;
        string  credentialType;
        string  metadataURI;
        uint256 issuedAt;
        uint256 expiresAt;
        bool    isRevoked;
    }
    function verifyCredential(uint256 _credentialId) external view returns (bool);
    function getCredential(uint256 _credentialId) external view returns (Credential memory);
}

contract IAMAccessControl {

    // ─────────────────────────────────────────────
    //  Data Structures
    // ─────────────────────────────────────────────

    /**
     * @dev Represents a named resource that access is controlled for.
     * @param resourceId      Unique identifier (auto-incremented).
     * @param owner           The address that registered and manages this resource.
     * @param name            A human-readable name for the resource (e.g., "Patient Records DB").
     * @param requiredCredentialType  If set, users must hold a valid credential of this type
     *                               to be granted access (empty string = no credential required).
     * @param isActive        Whether the resource is currently active.
     */
    struct Resource {
        uint256 resourceId;
        address owner;
        string  name;
        string  requiredCredentialType;
        bool    isActive;
    }

    /**
     * @dev Represents an access grant entry — records that a specific address
     *      holds a named role for a specific resource.
     * @param account    The DID holder's address being granted the role.
     * @param role       The role label (e.g., "VIEWER", "EDITOR", "ADMIN").
     * @param grantedAt  Block timestamp when the role was granted.
     * @param isActive   Whether this grant is currently active.
     */
    struct RoleGrant {
        address account;
        string  role;
        uint256 grantedAt;
        bool    isActive;
    }

    // ─────────────────────────────────────────────
    //  State Variables
    // ─────────────────────────────────────────────

    /// @dev Reference to the DIDRegistry for validating DID holders.
    IDIDRegistry public didRegistry;

    /// @dev Reference to the CredentialIssuer for verifying credentials.
    ICredentialIssuer public credentialIssuer;

    /// @dev Auto-incrementing resource ID counter.
    uint256 private resourceCounter;

    /**
     * @dev Maps resource ID to its Resource record.
     */
    mapping(uint256 => Resource) private resources;

    /**
     * @dev Maps resourceId => account address => role string => RoleGrant.
     *      Allows checking if a specific address holds a specific role on a resource.
     *      e.g., roleGrants[1][0xABC]["VIEWER"] => RoleGrant{...}
     */
    mapping(uint256 => mapping(address => mapping(string => RoleGrant))) private roleGrants;

    /**
     * @dev Tracks all resources owned by a given address.
     *      Used to enumerate an owner's resources.
     */
    mapping(address => uint256[]) private ownerResources;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    /**
     * @dev Emitted when a new resource is registered.
     * @param resourceId The unique ID of the newly registered resource.
     * @param owner      The address that registered the resource.
     * @param name       The human-readable name of the resource.
     */
    event ResourceRegistered(uint256 indexed resourceId, address indexed owner, string name);

    /**
     * @dev Emitted when a resource is deactivated by its owner.
     */
    event ResourceDeactivated(uint256 indexed resourceId);

    /**
     * @dev Emitted when a role is granted to a DID holder for a resource.
     * @param resourceId The resource the role applies to.
     * @param account    The address receiving the role.
     * @param role       The role label granted.
     * @param grantor    The resource owner who granted the role.
     */
    event RoleGranted(
        uint256 indexed resourceId,
        address indexed account,
        string role,
        address indexed grantor
    );

    /**
     * @dev Emitted when a role is revoked from a DID holder.
     */
    event RoleRevoked(uint256 indexed resourceId, address indexed account, string role);

    /**
     * @dev Emitted when an access check is performed and logged on-chain.
     * @param resourceId  The resource being accessed.
     * @param account     The address requesting access.
     * @param role        The role being checked.
     * @param granted     Whether access was granted.
     */
    event AccessChecked(
        uint256 indexed resourceId,
        address indexed account,
        string role,
        bool granted
    );

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    /**
     * @dev Ensures the caller is the owner of the specified resource.
     */
    modifier onlyResourceOwner(uint256 _resourceId) {
        require(resources[_resourceId].isActive, "AccessControl: Resource does not exist or is inactive");
        require(resources[_resourceId].owner == msg.sender, "AccessControl: Caller is not the resource owner");
        _;
    }

    /**
     * @dev Ensures the caller has an active DID in the registry.
     */
    modifier onlyActiveDIDHolder() {
        require(didRegistry.isActiveDID(msg.sender), "AccessControl: Caller does not have an active DID");
        _;
    }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    /**
     * @notice Deploys the IAMAccessControl contract and links it to the
     *         DIDRegistry and CredentialIssuer contracts.
     * @param _didRegistryAddress      Deployed address of the DIDRegistry contract.
     * @param _credentialIssuerAddress Deployed address of the CredentialIssuer contract.
     */
    constructor(address _didRegistryAddress, address _credentialIssuerAddress) {
        require(_didRegistryAddress != address(0), "AccessControl: Invalid DIDRegistry address");
        require(_credentialIssuerAddress != address(0), "AccessControl: Invalid CredentialIssuer address");
        didRegistry        = IDIDRegistry(_didRegistryAddress);
        credentialIssuer   = ICredentialIssuer(_credentialIssuerAddress);
    }

    // ─────────────────────────────────────────────
    //  Resource Management
    // ─────────────────────────────────────────────

    /**
     * @notice Registers a new resource under the caller's ownership.
     * @dev The caller must have an active DID. An optional required credential type
     *      can be specified — if set, only holders of a valid credential of that type
     *      can be granted roles on this resource.
     * @param _name                   Human-readable resource name.
     * @param _requiredCredentialType Credential type required for access (empty = none required).
     * @return resourceId             The unique ID assigned to the new resource.
     *
     * Emits a {ResourceRegistered} event.
     */
    function registerResource(
        string calldata _name,
        string calldata _requiredCredentialType
    ) external onlyActiveDIDHolder returns (uint256 resourceId) {
        require(bytes(_name).length > 0, "AccessControl: Resource name cannot be empty");

        resourceCounter++;
        resourceId = resourceCounter;

        resources[resourceId] = Resource({
            resourceId:             resourceId,
            owner:                  msg.sender,
            name:                   _name,
            requiredCredentialType: _requiredCredentialType,
            isActive:               true
        });

        ownerResources[msg.sender].push(resourceId);

        emit ResourceRegistered(resourceId, msg.sender, _name);
    }

    /**
     * @notice Deactivates a resource, preventing any further role grants.
     * @dev Only the resource owner can deactivate their resource.
     *      Existing role grants are not automatically cleared.
     * @param _resourceId The ID of the resource to deactivate.
     *
     * Emits a {ResourceDeactivated} event.
     */
    function deactivateResource(uint256 _resourceId) external onlyResourceOwner(_resourceId) {
        resources[_resourceId].isActive = false;
        emit ResourceDeactivated(_resourceId);
    }

    // ─────────────────────────────────────────────
    //  Role Management
    // ─────────────────────────────────────────────

    /**
     * @notice Grants a named role to a DID holder for a specific resource.
     * @dev The caller must be the resource owner. The target account must have an
     *      active DID. If the resource requires a specific credential type, the caller
     *      must supply a valid credential ID of that type held by the account.
     * @param _resourceId    The ID of the resource to grant access to.
     * @param _account       The DID holder address to grant the role to.
     * @param _role          The role label to assign (e.g., "VIEWER", "EDITOR").
     * @param _credentialId  The credential ID to verify (use 0 if no credential required).
     *
     * Emits a {RoleGranted} event.
     */
    function grantRole(
        uint256 _resourceId,
        address _account,
        string calldata _role,
        uint256 _credentialId
    ) external onlyResourceOwner(_resourceId) {
        require(_account != address(0), "AccessControl: Invalid account address");
        require(bytes(_role).length > 0, "AccessControl: Role cannot be empty");
        require(didRegistry.isActiveDID(_account), "AccessControl: Account does not have an active DID");
        require(
            !roleGrants[_resourceId][_account][_role].isActive,
            "AccessControl: Role already granted"
        );

        // If the resource requires a credential type, verify the provided credential
        string memory requiredType = resources[_resourceId].requiredCredentialType;
        if (bytes(requiredType).length > 0) {
            require(_credentialId != 0, "AccessControl: Credential ID required for this resource");
            require(
                credentialIssuer.verifyCredential(_credentialId),
                "AccessControl: Provided credential is invalid or expired"
            );
            // Verify the credential belongs to the account and matches the required type
            ICredentialIssuer.Credential memory cred = credentialIssuer.getCredential(_credentialId);
			address subject  = cred.subject;
			string memory credType = cred.credentialType;
            require(subject == _account, "AccessControl: Credential does not belong to this account");
            require(
                keccak256(bytes(credType)) == keccak256(bytes(requiredType)),
                "AccessControl: Credential type does not match resource requirement"
            );
        }

        roleGrants[_resourceId][_account][_role] = RoleGrant({
            account:   _account,
            role:      _role,
            grantedAt: block.timestamp,
            isActive:  true
        });

        emit RoleGranted(_resourceId, _account, _role, msg.sender);
    }

    /**
     * @notice Revokes a previously granted role from a DID holder.
     * @dev Only the resource owner can revoke roles on their resource.
     * @param _resourceId The ID of the resource.
     * @param _account    The address whose role is being revoked.
     * @param _role       The role label to revoke.
     *
     * Emits a {RoleRevoked} event.
     */
    function revokeRole(
        uint256 _resourceId,
        address _account,
        string calldata _role
    ) external onlyResourceOwner(_resourceId) {
        require(
            roleGrants[_resourceId][_account][_role].isActive,
            "AccessControl: Role not currently granted"
        );

        roleGrants[_resourceId][_account][_role].isActive = false;

        emit RoleRevoked(_resourceId, _account, _role);
    }

    // ─────────────────────────────────────────────
    //  Access Verification
    // ─────────────────────────────────────────────

    /**
     * @notice Checks whether an account holds an active role on a resource.
     * @dev This is a read-only check with no side effects. Use checkAndLogAccess()
     *      if you need the result recorded on-chain via an event.
     * @param _resourceId The ID of the resource.
     * @param _account    The address to check.
     * @param _role       The role label to verify.
     * @return True if the account holds the active role, false otherwise.
     */
    function hasRole(
        uint256 _resourceId,
        address _account,
        string calldata _role
    ) external view returns (bool) {
        return roleGrants[_resourceId][_account][_role].isActive;
    }

    /**
     * @notice Performs an access check and emits an on-chain event recording the outcome.
     * @dev Use this when an auditable access log is required.
     *      The caller checks their own access; the result is emitted as an event.
     * @param _resourceId The ID of the resource being accessed.
     * @param _role       The role the caller claims to hold.
     * @return granted    True if the caller holds the active role, false otherwise.
     *
     * Emits an {AccessChecked} event.
     */
    function checkAndLogAccess(
        uint256 _resourceId,
        string calldata _role
    ) external returns (bool granted) {
        granted = roleGrants[_resourceId][msg.sender][_role].isActive;
        emit AccessChecked(_resourceId, msg.sender, _role, granted);
    }

    // ─────────────────────────────────────────────
    //  View Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Returns the full Resource record for a given resource ID.
     * @param _resourceId The ID of the resource to retrieve.
     * @return The Resource struct.
     */
    function getResource(uint256 _resourceId) external view returns (Resource memory) {
        require(resources[_resourceId].resourceId != 0, "AccessControl: Resource does not exist");
        return resources[_resourceId];
    }

    /**
     * @notice Returns all resource IDs registered by a given owner address.
     * @param _owner The owner address to query.
     * @return An array of resource IDs owned by the address.
     */
    function getResourcesByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerResources[_owner];
    }

    /**
     * @notice Returns the full RoleGrant record for a given resource, account, and role.
     * @param _resourceId The resource ID.
     * @param _account    The account address.
     * @param _role       The role label.
     * @return The RoleGrant struct.
     */
    function getRoleGrant(
        uint256 _resourceId,
        address _account,
        string calldata _role
    ) external view returns (RoleGrant memory) {
        return roleGrants[_resourceId][_account][_role];
    }
}
