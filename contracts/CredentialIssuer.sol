// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredentialIssuer
 * @author Team 18 - CSE 540, Arizona State University (2025SpringB)
 * @notice This contract manages the issuance and revocation of verifiable credentials
 *         tied to Decentralized Identifiers (DIDs). Trusted issuers (e.g., universities,
 *         employers, government agencies) can issue credentials to registered DID holders,
 *         and any party can verify whether a credential is valid on-chain.
 *
 * @dev Credentials are stored on-chain as structured records. Each credential has a unique
 *      ID, an issuer, a subject (the DID holder's address), a credential type, and an
 *      optional expiry timestamp. The DIDRegistry contract is referenced to validate that
 *      subjects have an active DID before a credential can be issued.
 *
 * Design Pattern: Issuer-Holder-Verifier triangle (W3C Verifiable Credentials model).
 */

/**
 * @dev Minimal interface to the DIDRegistry contract.
 *      Used to verify that a subject has an active DID before issuing a credential.
 */
interface IDIDRegistry {
    function isActiveDID(address _owner) external view returns (bool);
}

contract CredentialIssuer {

    // ─────────────────────────────────────────────
    //  Data Structures
    // ─────────────────────────────────────────────

    /**
     * @dev Represents a single verifiable credential record stored on-chain.
     * @param credentialId   Unique identifier for this credential (auto-incremented).
     * @param issuer         Address of the trusted entity that issued the credential.
     * @param subject        Address of the DID holder receiving the credential.
     * @param credentialType A string label for the type of credential (e.g., "DegreeCredential").
     * @param metadataURI    URI pointing to the full credential document (e.g., on IPFS).
     * @param issuedAt       Block timestamp when the credential was issued.
     * @param expiresAt      Block timestamp when the credential expires (0 = no expiry).
     * @param isRevoked      Whether the credential has been revoked by the issuer.
     */
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

    // ─────────────────────────────────────────────
    //  State Variables
    // ─────────────────────────────────────────────

    /// @dev Reference to the deployed DIDRegistry contract for DID validation.
    IDIDRegistry public didRegistry;

    /// @dev Contract deployer / administrator who manages trusted issuers.
    address public admin;

    /// @dev Auto-incrementing counter for assigning unique credential IDs.
    uint256 private credentialCounter;

    /**
     * @dev Maps a credential ID to its full Credential record.
     */
    mapping(uint256 => Credential) private credentials;

    /**
     * @dev Maps an issuer address to their trusted status.
     *      Only addresses marked true can issue credentials.
     */
    mapping(address => bool) private trustedIssuers;

    /**
     * @dev Maps a subject address to an array of their credential IDs.
     *      Allows looking up all credentials held by a given DID owner.
     */
    mapping(address => uint256[]) private subjectCredentials;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    /**
     * @dev Emitted when a new trusted issuer is added by the admin.
     */
    event IssuerAdded(address indexed issuer);

    /**
     * @dev Emitted when a trusted issuer is removed by the admin.
     */
    event IssuerRemoved(address indexed issuer);

    /**
     * @dev Emitted when a new credential is successfully issued.
     * @param credentialId The unique ID of the newly issued credential.
     * @param issuer       The address that issued the credential.
     * @param subject      The address of the credential recipient.
     * @param credentialType The type label of the credential.
     */
    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed issuer,
        address indexed subject,
        string credentialType
    );

    /**
     * @dev Emitted when a credential is revoked by its original issuer.
     * @param credentialId The ID of the revoked credential.
     * @param issuer       The address that revoked the credential.
     */
    event CredentialRevoked(uint256 indexed credentialId, address indexed issuer);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    /**
     * @dev Restricts access to the contract admin only.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "CredentialIssuer: Caller is not the admin");
        _;
    }

    /**
     * @dev Restricts access to addresses registered as trusted issuers.
     */
    modifier onlyTrustedIssuer() {
        require(trustedIssuers[msg.sender], "CredentialIssuer: Caller is not a trusted issuer");
        _;
    }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    /**
     * @notice Deploys the CredentialIssuer and links it to an existing DIDRegistry.
     * @dev The deployer becomes the admin. The DIDRegistry address must be provided
     *      at deployment and cannot be changed afterward.
     * @param _didRegistryAddress The deployed address of the DIDRegistry contract.
     */
    constructor(address _didRegistryAddress) {
        require(_didRegistryAddress != address(0), "CredentialIssuer: Invalid DIDRegistry address");
        didRegistry = IDIDRegistry(_didRegistryAddress);
        admin = msg.sender;
    }

    // ─────────────────────────────────────────────
    //  Issuer Management (Admin Only)
    // ─────────────────────────────────────────────

    /**
     * @notice Grants trusted issuer status to an address.
     * @dev Only the admin can add trusted issuers. Trusted issuers can issue credentials.
     * @param _issuer The address to grant issuer privileges to.
     *
     * Emits an {IssuerAdded} event.
     */
    function addTrustedIssuer(address _issuer) external onlyAdmin {
        require(_issuer != address(0), "CredentialIssuer: Invalid issuer address");
        require(!trustedIssuers[_issuer], "CredentialIssuer: Already a trusted issuer");
        trustedIssuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    /**
     * @notice Revokes trusted issuer status from an address.
     * @dev Removing an issuer does not revoke credentials they previously issued.
     * @param _issuer The address to remove issuer privileges from.
     *
     * Emits an {IssuerRemoved} event.
     */
    function removeTrustedIssuer(address _issuer) external onlyAdmin {
        require(trustedIssuers[_issuer], "CredentialIssuer: Not a trusted issuer");
        trustedIssuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    // ─────────────────────────────────────────────
    //  Credential Issuance & Revocation
    // ─────────────────────────────────────────────

    /**
     * @notice Issues a new verifiable credential to a DID holder.
     * @dev Only trusted issuers can call this function. The subject must have an
     *      active DID registered in the DIDRegistry. An optional expiry timestamp
     *      can be set; pass 0 for a non-expiring credential.
     * @param _subject        The address of the DID holder receiving the credential.
     * @param _credentialType A string label for the credential type (e.g., "DegreeCredential").
     * @param _metadataURI    URI pointing to the full credential document (e.g., IPFS CID).
     * @param _expiresAt      Expiry timestamp in seconds (Unix time). Use 0 for no expiry.
     * @return credentialId   The unique ID assigned to the newly issued credential.
     *
     * Emits a {CredentialIssued} event.
     */
    function issueCredential(
        address _subject,
        string calldata _credentialType,
        string calldata _metadataURI,
        uint256 _expiresAt
    ) external onlyTrustedIssuer returns (uint256 credentialId) {
        require(_subject != address(0), "CredentialIssuer: Invalid subject address");
        require(
            didRegistry.isActiveDID(_subject),
            "CredentialIssuer: Subject does not have an active DID"
        );
        require(bytes(_credentialType).length > 0, "CredentialIssuer: Credential type cannot be empty");
        require(
            _expiresAt == 0 || _expiresAt > block.timestamp,
            "CredentialIssuer: Expiry must be in the future"
        );

        credentialCounter++;
        credentialId = credentialCounter;

        credentials[credentialId] = Credential({
            credentialId:   credentialId,
            issuer:         msg.sender,
            subject:        _subject,
            credentialType: _credentialType,
            metadataURI:    _metadataURI,
            issuedAt:       block.timestamp,
            expiresAt:      _expiresAt,
            isRevoked:      false
        });

        subjectCredentials[_subject].push(credentialId);

        emit CredentialIssued(credentialId, msg.sender, _subject, _credentialType);
    }

    /**
     * @notice Revokes an existing credential.
     * @dev Only the original issuer of the credential can revoke it.
     *      Revoked credentials remain on-chain for audit purposes but are
     *      marked invalid in the isRevoked field.
     * @param _credentialId The ID of the credential to revoke.
     *
     * Emits a {CredentialRevoked} event.
     */
    function revokeCredential(uint256 _credentialId) external {
        Credential storage cred = credentials[_credentialId];
        require(cred.credentialId != 0, "CredentialIssuer: Credential does not exist");
        require(cred.issuer == msg.sender, "CredentialIssuer: Only the original issuer can revoke");
        require(!cred.isRevoked, "CredentialIssuer: Credential already revoked");

        cred.isRevoked = true;

        emit CredentialRevoked(_credentialId, msg.sender);
    }

    // ─────────────────────────────────────────────
    //  View / Verification Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Returns the full credential record for a given credential ID.
     * @param _credentialId The ID of the credential to retrieve.
     * @return The full Credential struct.
     */
    function getCredential(uint256 _credentialId) external view returns (Credential memory) {
        require(credentials[_credentialId].credentialId != 0, "CredentialIssuer: Credential does not exist");
        return credentials[_credentialId];
    }

    /**
     * @notice Verifies whether a credential is currently valid.
     * @dev A credential is valid if: it exists, is not revoked, and has not expired.
     *      This is the primary function a verifier (e.g., an employer) would call.
     * @param _credentialId The ID of the credential to verify.
     * @return True if the credential is valid, false otherwise.
     */
    function verifyCredential(uint256 _credentialId) external view returns (bool) {
        Credential memory cred = credentials[_credentialId];
        if (cred.credentialId == 0)   return false; // does not exist
        if (cred.isRevoked)           return false; // revoked
        if (cred.expiresAt != 0 && block.timestamp > cred.expiresAt) return false; // expired
        return true;
    }

    /**
     * @notice Returns all credential IDs held by a given subject address.
     * @param _subject The address of the DID holder.
     * @return An array of credential IDs associated with the subject.
     */
    function getCredentialsBySubject(address _subject) external view returns (uint256[] memory) {
        return subjectCredentials[_subject];
    }

    /**
     * @notice Checks whether an address is a trusted issuer.
     * @param _issuer The address to check.
     * @return True if the address is a trusted issuer.
     */
    function isTrustedIssuer(address _issuer) external view returns (bool) {
        return trustedIssuers[_issuer];
    }

    /**
     * @notice Returns only the subject address of a credential.
     * @dev Targeted getter used by IAMAccessControl to avoid cross-contract
     *      struct return ABI issues.
     * @param _credentialId The ID of the credential to query.
     * @return The subject address of the credential.
     */
    function getCredentialSubject(uint256 _credentialId) external view returns (address) {
        require(credentials[_credentialId].credentialId != 0, "CredentialIssuer: Credential does not exist");
        return credentials[_credentialId].subject;
    }

    /**
     * @notice Returns only the credential type string of a credential.
     * @dev Targeted getter used by IAMAccessControl to avoid cross-contract
     *      struct return ABI issues.
     * @param _credentialId The ID of the credential to query.
     * @return The credential type string.
     */
    function getCredentialType(uint256 _credentialId) external view returns (string memory) {
        require(credentials[_credentialId].credentialId != 0, "CredentialIssuer: Credential does not exist");
        return credentials[_credentialId].credentialType;
    }
}

// NOTE: getCredentialSubject and getCredentialType added below isTrustedIssuer
