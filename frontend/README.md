# Decentralized Identity and Access Management (IAM) dApp Frontend

A modern, interactive web UI for managing decentralized identities and verifiable credentials on the Polygon Amoy testnet.

## Features

- **Wallet Management**: Connect MetaMask and manage Polygon Amoy network
- **Student/Holder Interface**: Register, update, and manage your DID
- **University/Issuer Interface**: Issue and manage verifiable credentials
- **Employer/Verifier Interface**: Verify credentials and check student status
- **Resource Owner Interface**: Create resources and manage role-based access control
- **Real-time Blockchain Interaction**: All operations directly interact with smart contracts
- **Full Error Handling**: User-friendly error messages for failed transactions

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your deployed contract addresses:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_DID_REGISTRY_ADDRESS=0x...
VITE_CREDENTIAL_ISSUER_ADDRESS=0x...
VITE_ACCESS_CONTROL_ADDRESS=0x...
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## How to Use

### Student / DID Holder
1. Connect MetaMask wallet
2. Go to "Student / Holder" tab
3. Register your DID by providing a DID URI (IPFS CID or did:ethr string)
4. Update or revoke your DID as needed
5. Look up DIDs of other students

### University / Credential Issuer
1. Connect as a university representative
2. Go to "University / Issuer" tab
3. Admin can add trusted issuers
4. Issue credentials to students who have registered DIDs
5. Manage and revoke issued credentials

### Employer / Verifier
1. Connect MetaMask wallet
2. Go to "Employer / Verifier" tab
3. Enter a credential ID to verify its validity
4. Look up all credentials held by a student
5. Check if credentials are valid, expired, or revoked

### Resource Owner
1. Connect MetaMask wallet
2. Go to "Resource Owner" tab
3. Register a resource (e.g., "HR System")
4. Optionally set a required credential type
5. Grant roles to users (with optional credential verification)
6. Check user access and log access attempts

## Architecture

```
frontend/
├── src/
│   ├── components/       # React UI components
│   ├── hooks/           # Custom React hooks for wallet & contracts
│   ├── lib/             # Blockchain service layer & utilities
│   ├── types/           # TypeScript interfaces
│   ├── pages/           # Page-level components
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

### Key Components

- **`blockchain-service.ts`**: Ethers.js wrapper for wallet connection, network switching, and contract calls
- **`useWallet()`**: Manages wallet connection state and MetaMask listeners
- **`useNetworkCheck()`**: Monitors network and enables Polygon Amoy switching
- **`useContractService()`**: Provides typed methods for all contract interactions
- **`DIDManagement`**: Student interface for DID lifecycle
- **`CredentialManagement`**: Issuer interface for credential lifecycle
- **`CredentialVerification`**: Verifier interface for checking credentials
- **`AccessControlManagement`**: Resource owner interface for access control

## Contract Functions Supported

### DIDRegistry
- `registerDID()` - Register a new DID
- `updateDID()` - Update existing DID
- `revokeDID()` - Revoke your DID
- `getDID()` - View DID record
- `isActiveDID()` - Check if DID is active

### CredentialIssuer
- `addTrustedIssuer()` - Add issuer (admin)
- `removeTrustedIssuer()` - Remove issuer (admin)
- `issueCredential()` - Issue credential
- `revokeCredential()` - Revoke credential
- `getCredential()` - View credential
- `verifyCredential()` - Verify credential validity
- `getCredentialsBySubject()` - Get all credentials for a student

### IAMAccessControl
- `registerResource()` - Create resource
- `deactivateResource()` - Deactivate resource
- `grantRole()` - Grant role to user
- `revokeRole()` - Revoke role
- `hasRole()` - Check if user has role
- `checkAndLogAccess()` - Log access attempt

## Network Configuration

**Polygon Amoy Testnet**
- Chain ID: 80002
- RPC: https://rpc-amoy.polygon.technology
- Explorer: https://www.oklink.com/amoy
- Currency: MATIC (test faucet: https://faucet.polygon.technology/)

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow prompts and set environment variables in Vercel dashboard.

### Deploy to GitHub Pages

```bash
npm run build
# Copy dist/ to GitHub Pages branch
```

## Troubleshooting

**MetaMask not found**: Install MetaMask browser extension
**Wrong network**: Use "Switch to Polygon Amoy" button in header
**Contract call fails**: Ensure addresses are correctly configured in `.env`
**Transaction reverted**: Check error message - likely validation error (empty DID, invalid address, etc.)

## Development

### Technologies Used
- React 19 with TypeScript
- Ethers.js v6 for blockchain interaction
- Tailwind CSS for styling
- Vite for build tooling

### Type Safety
All contract functions and returns are fully typed. See `src/types/contracts.ts` for interfaces.

### Error Handling
Human-friendly error messages are mapped from contract revert reasons in `lib/error-handler.ts`.

## License

ISC

## Support

For issues or questions, please check:
1. Browser console for detailed error logs
2. PolygonScan (https://www.oklink.com/amoy) for transaction details
3. Contract addresses are correctly set in `.env`
4. MetaMask is on Polygon Amoy testnet
