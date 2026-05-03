# Frontend UI Setup Guide

## ✅ What's Been Built

Your complete React frontend for the Decentralized IAM dApp is ready. It includes:

- **4 tabbed interfaces**: Student, University, Employer, Resource Owner
- **Wallet management**: MetaMask connection + Polygon Amoy network switching
- **Contract integration**: All functions from DIDRegistry, CredentialIssuer, IAMAccessControl
- **Error handling**: User-friendly messages for failed transactions
- **Responsive design**: Tailwind CSS, mobile-friendly layout
- **Transaction feedback**: Live TX hash links to PolygonScan

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React UI components (DID, Credentials, Access Control)
│   ├── hooks/              # Custom hooks (useWallet, useContractService, useNetworkCheck)
│   ├── lib/                # Blockchain service layer & utilities
│   │   ├── blockchain-service.ts     # Ethers.js wrapper
│   │   ├── contract-config.ts        # Contract ABIs & addresses
│   │   ├── error-handler.ts          # Parse revert messages
│   │   └── address-utils.ts          # Address/timestamp formatting
│   ├── types/              # TypeScript interfaces (Credential, DIDRecord, etc.)
│   ├── pages/              # Dashboard (main page with tabs)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Global styles + Tailwind
├── package.json            # Dependencies
├── .env.example            # Template for environment variables
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md               # Full documentation
```

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `react` & `react-dom` (UI framework)
- `ethers` v6 (blockchain interaction)
- `vite` (build tool)
- `typescript` (type safety)
- `tailwindcss` (styling)

### Step 2: Configure Environment Variables

Copy the example file and add your deployed contract addresses:

```bash
cp .env.example .env
```

Edit `frontend/.env` and fill in your contract addresses from Polygon Amoy deployment:

```env
VITE_DID_REGISTRY_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
VITE_CREDENTIAL_ISSUER_ADDRESS=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
VITE_ACCESS_CONTROL_ADDRESS=0xfedcbafedcbafedcbafedcbafedcbafedcbafed
```

**Where to find these addresses:**
- Hardhat deployment logs when you run `npx hardhat run scripts/deploy.js --network polygon-amoy`
- Or the `.env` in your root project directory if you've deployed

### Step 3: Start Development Server

```bash
npm run dev
```

The browser will automatically open at `http://localhost:5173`

**What you'll see:**
- Blue header with "IAM dApp"
- Connect MetaMask button (top right)
- Prompts to connect wallet and switch to Polygon Amoy
- 4 tabs once connected: Student, University, Employer, Resource Owner

### Step 4: Test with MetaMask

1. **Connect MetaMask**
   - Click "Connect MetaMask" button
   - Approve connection in MetaMask popup

2. **Switch to Polygon Amoy**
   - Click "Switch to Polygon Amoy" button
   - MetaMask will add the network and switch

3. **Test DID Registration** (Student tab)
   - Enter a DID URI: `ipfs://QmTestDID123` or `did:ethr:0x...`
   - Click "Register DID"
   - Approve tx in MetaMask
   - See TX hash with link to PolygonScan

4. **Test Credential Issuance** (University tab)
   - Add a trusted issuer (if you're the admin)
   - Issue a credential to a student address
   - See TX hash on success

5. **Test Credential Verification** (Employer tab)
   - Enter a credential ID
   - See verification status (Valid/Invalid/Expired)
   - Lookup all credentials for a student

6. **Test Access Control** (Resource Owner tab)
   - Register a resource
   - Grant a role to a user
   - Check if user has role

## 🔧 Environment Variables

```env
# Required: Deployed contract addresses on Polygon Amoy
VITE_DID_REGISTRY_ADDRESS=0x...
VITE_CREDENTIAL_ISSUER_ADDRESS=0x...
VITE_ACCESS_CONTROL_ADDRESS=0x...

# Optional: Custom RPC endpoint (defaults to polygon-amoy)
# VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
```

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

## 🌐 Deploy to Vercel (Free)

1. Push your code to GitHub (with `frontend/` directory)
2. Connect to Vercel: https://vercel.com/new
3. Set environment variables in Vercel dashboard
4. Deploy!

## 📝 Component Mapping to Contracts

### Student / Holder Tab → DIDRegistry
- Register DID → `registerDID(didURI)`
- Update DID → `updateDID(newDIDURI)`
- Revoke DID → `revokeDID()`
- Lookup DID → `getDID(address)`, `isActiveDID(address)`

### University / Issuer Tab → CredentialIssuer
- Add Trusted Issuer → `addTrustedIssuer(issuer)` [admin only]
- Remove Trusted Issuer → `removeTrustedIssuer(issuer)` [admin only]
- Issue Credential → `issueCredential(subject, type, metadataURI, expiresAt)`
- Revoke Credential → `revokeCredential(credentialId)`
- Lookup Credential → `getCredential(credentialId)`, `verifyCredential(credentialId)`

### Employer / Verifier Tab → CredentialIssuer (read-only)
- Verify Credential → `verifyCredential(credentialId)`
- Get Credential Details → `getCredential(credentialId)`
- Lookup Student Credentials → `getCredentialsBySubject(studentAddress)`

### Resource Owner Tab → IAMAccessControl
- Register Resource → `registerResource(name, requiredCredentialType)`
- View Resource → `getResource(resourceId)`
- Deactivate Resource → `deactivateResource(resourceId)`
- Grant Role → `grantRole(resourceId, account, role, credentialId)`
- Revoke Role → `revokeRole(resourceId, account, role)`
- Check Role → `hasRole(resourceId, account, role)`
- Check & Log Access → `checkAndLogAccess(resourceId, role)`

## 🐛 Troubleshooting

### MetaMask Not Found
**Error**: "MetaMask is not installed"
**Solution**: Install MetaMask extension from https://metamask.io

### Wrong Network
**Error**: "You are not connected to Polygon Amoy"
**Solution**: Click "Switch Network" button in header

### Contract Addresses Not Set
**Error**: "DIDRegistry address not configured in .env"
**Solution**: 
1. Verify `.env` file exists (copy from `.env.example`)
2. Check addresses are correct and don't start with `0x` without the full hex
3. Restart dev server: Ctrl+C, then `npm run dev`

### Transaction Fails
**Error**: "DIDRegistry: DID already registered"
**Solution**: This is a contract validation error (expected). The UI shows these user-friendly.

### Blank Page / Errors
**Solution**:
1. Check browser console (F12) for error messages
2. Verify MetaMask is connected
3. Clear cache: Ctrl+Shift+Delete
4. Restart dev server: Ctrl+C, then `npm run dev`

## 📚 Key Code Files

### Start Here
- [frontend/src/App.tsx](src/App.tsx) - Main app component
- [frontend/src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) - Dashboard with tabs

### Blockchain Layer
- [frontend/src/lib/blockchain-service.ts](src/lib/blockchain-service.ts) - Ethers.js wrapper
- [frontend/src/lib/contract-config.ts](src/lib/contract-config.ts) - Contract ABIs

### Hooks
- [frontend/src/hooks/useWallet.ts](src/hooks/useWallet.ts) - Wallet connection
- [frontend/src/hooks/useContractService.ts](src/hooks/useContractService.ts) - Contract calls

### Components
- [frontend/src/components/DIDManagement.tsx](src/components/DIDManagement.tsx) - Student interface
- [frontend/src/components/CredentialManagement.tsx](src/components/CredentialManagement.tsx) - Issuer interface
- [frontend/src/components/CredentialVerification.tsx](src/components/CredentialVerification.tsx) - Verifier interface
- [frontend/src/components/AccessControlManagement.tsx](src/components/AccessControlManagement.tsx) - Access control interface

## 🎯 Demo Walkthrough (2-3 minutes)

1. **Connect & Setup** (30 sec)
   - Click "Connect MetaMask"
   - Click "Switch to Polygon Amoy"

2. **Student Registers DID** (1 min)
   - Go to "Student / Holder" tab
   - Enter DID URI
   - Click "Register DID"
   - Show successful TX hash

3. **University Issues Credential** (1 min)
   - Switch to "University / Issuer" tab
   - (If needed) Add yourself as trusted issuer
   - Enter student address, credential type, metadata
   - Click "Issue Credential"
   - Show TX hash

4. **Employer Verifies Credential** (30 sec)
   - Switch to "Employer / Verifier" tab
   - Enter credential ID
   - Show "✓ CREDENTIAL VALID" message

5. **Resource Owner Controls Access** (1 min)
   - Switch to "Resource Owner" tab
   - Register a resource
   - Grant a role to the student (using credential if required)
   - Check role → show "✓ User HAS this role"

## 📞 Support

- **Hardhat + Solidity Issues**: Check root project `/contracts` and `/test`
- **Frontend Issues**: Check `frontend/README.md` and browser console
- **Ethers.js Questions**: https://docs.ethers.org/v6/
- **Polygon Amoy Faucet**: https://faucet.polygon.technology/ (get test MATIC)

## ✨ Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Add contract addresses to `.env`
3. ✅ Deploy your smart contracts to Polygon Amoy
4. ✅ Start dev server (`npm run dev`)
5. ✅ Connect MetaMask and test flows
6. ✅ (Optional) Build for production (`npm run build`)
7. ✅ (Optional) Deploy to Vercel or GitHub Pages

Good luck! 🚀
