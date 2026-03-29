## IAM dApp Smart Contract Design (Team 18, ASU CSE 540)

This is a team project for CSE 540 and is currently under development. The code and tests are intended as a working proof of concept for DID + credential-based access control.

### What you’ll find in this repo

- `contracts/`: smart contracts in Solidity
	- `DIDRegistry.sol` (DID lifecycle)
	- `CredentialIssuer.sol` (trusted issuer credential system)
	- `AccessControl.sol` (resource-backed role management)
- `test/`:
	- `IAM.test.js` (node-based tests for full workflow and edge cases)
- setup files: `hardhat.config.ts`, `package.json`, `tsconfig.json`

### What we want to solve

- let people create and manage DIDs that can be deactivated safely
- let an admin and trusted issuers issue/ revoke credentials
- let resource owners grant/revoke roles based on credential requirements

## Local setup

1. Clone repository
	- `git clone https://github.com/ChunSuetIvy/Team18_2025FallB_CSE-540_iam-dapp-Project-Smart-Contract-Design.git`
	 - `cd Team18_2025FallB_CSE-540_iam-dapp-Project-Smart-Contract-Design`
2. Install dependencies
	 - `npm install`
3. Compile contracts
	 - `npx hardhat compile`

## Contracts quick reference

### `DIDRegistry`

- `registerDID(string didURI)`
- `updateDID(string didURI)`
- `revokeDID()`
- `getDID(address)`
- `isActiveDID(address)`

### `CredentialIssuer`

- `addTrustedIssuer(address)` / `removeTrustedIssuer(address)`
- `issueCredential(address subject, string credentialType, string metadataURI, uint256 expiresAt)`
- `revokeCredential(uint256 credentialId)`
- `verifyCredential(uint256 credentialId)`
- `getCredentialsBySubject(address subject)`

### `IAMAccessControl` (using `DIDRegistry` + `CredentialIssuer`)

- `registerResource(string name, string requiredCredentialType)`
- `grantRole(uint256 resourceId, address account, string role, uint256 credentialId)`
- `revokeRole(uint256 resourceId, address account, string role)`
- `hasRole(uint256 resourceId, address account, string role)`
- `checkAndLogAccess(uint256 resourceId, string role)`
- `deactivateResource(uint256 resourceId)`

## Test instructions

Run:

```bash
npx hardhat test
```

The suite checks:
- DID lifecycle states and access in `DIDRegistry`
- trusted issuer flow, issuance, revocation and verification in `CredentialIssuer`
- role grant/revoke and access checks in `IAMAccessControl`

## Usage flow explained

1. user registers DID in `DIDRegistry`
2. admin adds trusted issuer and issuer issues credential in `CredentialIssuer`
3. resource owner registers resource, sets required credential type, grants roles in `IAMAccessControl`
4. holder uses `checkAndLogAccess` to verify if they can use the resource

## Notes

- default execution is on Hardhat local network.
- for testnets/mainnet, set your key and RPC in `hardhat.config.ts` safely.

## Project style

Project content was written directly by Team 18.

## Team members

- Karim Mahmoud
- Vijay Nambi
- Ivy Ngai
- Reshmi Sinhahajari
