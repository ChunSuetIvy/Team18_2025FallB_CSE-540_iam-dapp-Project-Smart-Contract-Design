// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDRegistry
 * @author Team 18 - CSE 540, Arizona State University (2025SpringB)
 * @notice This contract serves as the on-chain registry for Decentralized Identifiers (DIDs).
 *         It allows users to register, update, and revoke their own DID documents
 *         without relying on any central authority.
 *
 * @dev Each Ethereum address maps to one DID record. The DID document URI points to
 *      off-chain metadata (e.g., stored on IPFS) describing the DID subject's public keys
 *      and service endpoints. Only the DID owner can modify or revoke their own record.
 *
 * Design Pattern: Self-sovereign identity — users hold full control over their DID.
 */
contract DIDRegistry {

    // ─────────────────────────────────────────────
    //  Data Structures
    // ─────────────────────────────────────────────

    /**
     * @dev Represents a single DID record stored on-chain.
     * @param didURI      A URI pointing to the DID document (e.g., an IPFS CID or did:ethr string).
     * @param owner       The Ethereum address that owns and controls this DID.
     * @param createdAt   Block timestamp when the DID was first registered.
     * @param updatedAt   Block timestamp of the most recent update.
     * @param isActive    Whether the DID is currently active (false = revoked).
     */
    struct DIDRecord {
        string  didURI;
        address owner;
        uint256 createdAt;
        uint256 updatedAt;
        bool    isActive;
    }

    // ─────────────────────────────────────────────
    //  State Variables
    // ─────────────────────────────────────────────

    /**
     * @dev Maps each owner address to their DID record.
     *      One address = one DID in this implementation.
     */
    mapping(address => DIDRecord) private didRecords;

    /**
     * @dev Tracks whether an address has already registered a DID.
     *      Used to distinguish "not registered" from "registered but revoked".
     */
    mapping(address => bool) private isRegistered;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    /**
     * @dev Emitted when a new DID is registered on-chain.
     * @param owner  The address registering the DID.
     * @param didURI The URI of the DID document.
     */
    event DIDRegistered(address indexed owner, string didURI);

    /**
     * @dev Emitted when an existing DID document URI is updated.
     * @param owner     The address of the DID owner.
     * @param newDIDURI The updated DID document URI.
     */
    event DIDUpdated(address indexed owner, string newDIDURI);

    /**
     * @dev Emitted when a DID is revoked by its owner.
     * @param owner The address whose DID has been revoked.
     */
    event DIDRevoked(address indexed owner);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    /**
     * @dev Restricts function access to the caller's own DID record.
     *      Reverts if the caller has not registered a DID.
     */
    modifier onlyDIDOwner() {
        require(isRegistered[msg.sender], "DIDRegistry: No DID registered for this address");
        _;
    }

    /**
     * @dev Ensures the caller's DID is currently active (not revoked).
     */
    modifier onlyActiveDID() {
        require(didRecords[msg.sender].isActive, "DIDRegistry: DID has been revoked");
        _;
    }

    // ─────────────────────────────────────────────
    //  Core Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Registers a new DID for the caller's Ethereum address.
     * @dev Each address may only register one DID. Reverts if a DID already exists.
     *      The DID document URI should point to a valid DID document (e.g., on IPFS).
     * @param _didURI A URI string representing the DID document location.
     *
     * Emits a {DIDRegistered} event.
     */
    function registerDID(string calldata _didURI) external {
        require(!isRegistered[msg.sender], "DIDRegistry: DID already registered for this address");
        require(bytes(_didURI).length > 0, "DIDRegistry: DID URI cannot be empty");

        didRecords[msg.sender] = DIDRecord({
            didURI:    _didURI,
            owner:     msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive:  true
        });

        isRegistered[msg.sender] = true;

        emit DIDRegistered(msg.sender, _didURI);
    }

    /**
     * @notice Updates the DID document URI for the caller's existing DID.
     * @dev Only the DID owner can update their own record, and the DID must be active.
     *      This is useful when rotating keys or updating service endpoints off-chain.
     * @param _newDIDURI The new URI pointing to the updated DID document.
     *
     * Emits a {DIDUpdated} event.
     */
    function updateDID(string calldata _newDIDURI) external onlyDIDOwner onlyActiveDID {
        require(bytes(_newDIDURI).length > 0, "DIDRegistry: New DID URI cannot be empty");

        didRecords[msg.sender].didURI    = _newDIDURI;
        didRecords[msg.sender].updatedAt = block.timestamp;

        emit DIDUpdated(msg.sender, _newDIDURI);
    }

    /**
     * @notice Permanently revokes the caller's DID.
     * @dev Sets isActive to false. Revoked DIDs cannot be reactivated.
     *      A new DID cannot be registered from the same address after revocation
     *      (enforced by the isRegistered mapping).
     *
     * Emits a {DIDRevoked} event.
     */
    function revokeDID() external onlyDIDOwner onlyActiveDID {
        didRecords[msg.sender].isActive  = false;
        didRecords[msg.sender].updatedAt = block.timestamp;

        emit DIDRevoked(msg.sender);
    }

    // ─────────────────────────────────────────────
    //  View / Query Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Returns the full DID record for a given address.
     * @dev Returns all fields of the DIDRecord struct. Callers should check isActive
     *      before trusting the DID as valid.
     * @param _owner The Ethereum address to look up.
     * @return The DIDRecord struct associated with the given address.
     */
    function getDID(address _owner) external view returns (DIDRecord memory) {
        require(isRegistered[_owner], "DIDRegistry: No DID registered for this address");
        return didRecords[_owner];
    }

    /**
     * @notice Checks whether a given address has an active, registered DID.
     * @dev Useful for other contracts (e.g., CredentialIssuer, AccessControl)
     *      to verify DID existence before performing operations.
     * @param _owner The address to check.
     * @return True if the address has a registered and active DID, false otherwise.
     */
    function isActiveDID(address _owner) external view returns (bool) {
        return isRegistered[_owner] && didRecords[_owner].isActive;
    }

    /**
     * @notice Returns only the DID URI string for a given address.
     * @dev Lightweight alternative to getDID() when only the URI is needed.
     * @param _owner The address whose DID URI is requested.
     * @return The DID document URI string.
     */
    function getDIDURI(address _owner) external view returns (string memory) {
        require(isRegistered[_owner], "DIDRegistry: No DID registered for this address");
        return didRecords[_owner].didURI;
    }
}
