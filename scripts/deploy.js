import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ethers } from 'ethers';
import { config } from 'dotenv';
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ARTIFACTS_DIR = join(__dirname, '..', 'artifacts', 'contracts');

function loadArtifact(sourceFile, contractName) {
  const artifactPath = join(ARTIFACTS_DIR, `${sourceFile}.sol`, `${contractName}.json`);
  if (!existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}. Run \`npm run compile\` first.`);
  }
  return JSON.parse(readFileSync(artifactPath, 'utf-8'));
}

const rpcUrl = process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.HARDHAT_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const signer = new ethers.Wallet(privateKey, provider);

async function main() {
  const deployer = await signer.getAddress();
  console.log('Deployer address:', deployer);
  console.log('Using RPC URL:', rpcUrl);

  const didRegistryArtifact = loadArtifact('DIDRegistry', 'DIDRegistry');
  const credentialIssuerArtifact = loadArtifact('CredentialIssuer', 'CredentialIssuer');
  const iamAccessControlArtifact = loadArtifact('AccessControl', 'IAMAccessControl');

  let nextNonce = await provider.getTransactionCount(deployer, 'latest');

  const DIDRegistry = new ethers.ContractFactory(
    didRegistryArtifact.abi,
    didRegistryArtifact.bytecode,
    signer
  );
  const didRegistry = await DIDRegistry.deploy({ nonce: nextNonce });
  await didRegistry.waitForDeployment();
  console.log('DIDRegistry deployed at:', didRegistry.target);
  nextNonce += 1;

  const CredentialIssuer = new ethers.ContractFactory(
    credentialIssuerArtifact.abi,
    credentialIssuerArtifact.bytecode,
    signer
  );
  const credentialIssuer = await CredentialIssuer.deploy(didRegistry.target, { nonce: nextNonce });
  await credentialIssuer.waitForDeployment();
  console.log('CredentialIssuer deployed at:', credentialIssuer.target);
  nextNonce += 1;

  const IAMAccessControl = new ethers.ContractFactory(
    iamAccessControlArtifact.abi,
    iamAccessControlArtifact.bytecode,
    signer
  );
  const accessControl = await IAMAccessControl.deploy(
    didRegistry.target,
    credentialIssuer.target,
    { nonce: nextNonce }
  );
  await accessControl.waitForDeployment();
  console.log('IAMAccessControl deployed at:', accessControl.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});