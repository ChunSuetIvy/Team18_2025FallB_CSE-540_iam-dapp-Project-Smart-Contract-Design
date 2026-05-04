# IAM dApp — Decentralized Identity and Access Management
## Team 18 | CSE 540: Engineering Blockchain Applications | Arizona State University

A blockchain-based university credential system implementing Self-Sovereign Identity (SSI). 
Students own Decentralized Identifiers (DIDs), universities issue verifiable credentials, 
and employers verify them on-chain without a central authority.

---

## What We Built

A fully functional dApp with three smart contracts and a React frontend demonstrating 
the complete credential lifecycle across four stakeholder roles.

### Smart Contracts (`contracts/`)
- `DIDRegistry.sol` — DID registration, update, and revocation lifecycle
- `CredentialIssuer.sol` — trusted issuer management and verifiable credential issuance
- `AccessControl.sol` — resource-backed role management using credential verification

### Frontend (`frontend/`)
Four role-based tabs demonstrating end-to-end stakeholder interactions:
- **Student / Holder** — register, update, lookup, and revoke DIDs
- **University / Issuer** — manage trusted issuers and issue credentials
- **Employer / Verifier** — verify credentials by ID and lookup student credentials
- **Resource Owner** — register resources, grant/revoke roles, check access

### Tests (`test/`)
- `IAM.test.js` — 41 passing tests covering full workflow and edge cases

---

## What We Solve

- Let people create and manage DIDs that can be deactivated safely
- Let an admin and trusted issuers issue and revoke verifiable credentials
- Let resource owners grant and revoke roles based on credential requirements
- Enable trustless verification — no central authority or issuer contact required

---

## Local Setup

### Prerequisites
- Node.js v18+
- npm
- MetaMask browser extension

### 1. Clone the repository
```bash
git clone https://github.com/ChunSuetIvy/Team18_2025FallB_CSE-540_iam-dapp-Project-Smart-Contract-Design.git
cd Team18_2025FallB_CSE-540_iam-dapp-Project-Smart-Contract-Design
```

### 2. Install dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Compile contracts
```bash
npx hardhat compile
```

### 4. Start local Hardhat network (Terminal 1)
```bash
npx hardhat node
```

### 5. Deploy contracts (Terminal 2)
```bash
node scripts/deploy.js
```

### 6. Start frontend (Terminal 3)
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### 7. Configure MetaMask
- Network: Localhost 8545 (Chain ID: 31337)
- Import Account #0 private key:
  `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

---

## Testnet Deployment (Polygon Amoy)

The project is configured for Polygon Amoy testnet deployment.
DIDRegistry was successfully deployed to Amoy at:
- Address: `0x0d6D3fAc86396CC6E0eB3E88a471858E18D9d311`
- Block: 37,703,324

To deploy to Amoy, create a `.env` file in the project root:
HARDHAT_RPC_URL=https://rpc-amoy.polygon.technology
HARDHAT_PRIVATE_KEY=<your_private_key>
AMOY_PRIVATE_KEY=<your_private_key>

Then run:
```bash
node scripts/deploy.js
```

---

## Contracts Quick Reference

### `DIDRegistry`
- `registerDID(string didURI)` — register a new DID
- `updateDID(string didURI)` — update DID URI
- `revokeDID()` — deactivate DID
- `getDID(address)` — lookup DID by address
- `isActiveDID(address)` — check if DID is active

### `CredentialIssuer`
- `addTrustedIssuer(address)` / `removeTrustedIssuer(address)` — manage trusted issuers
- `issueCredential(address subject, string credentialType, string metadataURI, uint256 expiresAt)` — issue credential
- `revokeCredential(uint256 credentialId)` — revoke credential
- `verifyCredential(uint256 credentialId)` — verify credential validity
- `getCredentialsBySubject(address subject)` — get all credentials for a subject

### `IAMAccessControl`
- `registerResource(string name, string requiredCredentialType)` — register a resource
- `grantRole(uint256 resourceId, address account, string role, uint256 credentialId)` — grant role
- `revokeRole(uint256 resourceId, address account, string role)` — revoke role
- `hasRole(uint256 resourceId, address account, string role)` — check role
- `checkAndLogAccess(uint256 resourceId, string role)` — verify and log access on-chain
- `deactivateResource(uint256 resourceId)` — deactivate resource

---

## Running Tests

```bash
npx hardhat test
```

The suite checks:
- DID lifecycle states and access control in `DIDRegistry`
- Trusted issuer flow, issuance, revocation and verification in `CredentialIssuer`
- Role grant/revoke and access checks in `IAMAccessControl`
- All 41 tests pass 

---

## Demo Flow

1. Student registers DID in `DIDRegistry`
2. Admin adds trusted issuer; issuer issues credential in `CredentialIssuer`
3. Resource owner registers resource and grants role in `IAMAccessControl`
4. Employer verifies credential trustlessly from the blockchain
5. Student uses `checkAndLogAccess` to verify resource access
6. Student revokes DID to complete the full lifecycle

---

## Notes

- Default execution is on Hardhat local network
- For testnet deployment, configure `.env` as described above
- Never commit your `.env` file — it is included in `.gitignore`
- Projected gas costs on Polygon Amoy: ~71.5k for DID registration, ~87.2k for 
  credential issuance, ~28.4k for revocation

---

## Team Members

- Karim Mahmoud
- Vijay Nambi
- Ivy Ngai
- Reshmi Sinhahajari

---

## Project Context

This project was developed for CSE 540: Engineering Blockchain Applications at 
Arizona State University (Spring 2026). All code was written directly by Team 18.