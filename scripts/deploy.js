// ─────────────────────────────────────────────────────────────────────────────
// scripts/deploy.js
// Team 18 — CSE 540, Arizona State University (2026SpringB)
// Deployment script for DIDRegistry, CredentialIssuer, and IAMAccessControl
//
// Usage:
//   Local Hardhat network:   npx hardhat run scripts/deploy.js
// ─────────────────────────────────────────────────────────────────────────────

import { network } from "hardhat";

const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);

console.log("─────────────────────────────────────────────");
console.log("  Team 18 — Decentralized IAM dApp Deployer  ");
console.log("─────────────────────────────────────────────");
console.log(`Deployer:  ${deployer.address}`);
console.log(`Balance:   ${ethers.formatEther(balance)} ETH`);
console.log("─────────────────────────────────────────────\n");

// ── Step 1: Deploy DIDRegistry ──────────────────────────────────────────────
console.log("1/3  Deploying DIDRegistry...");
const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
const didRegistry = await DIDRegistry.deploy();
await didRegistry.waitForDeployment();
const didRegistryAddress = await didRegistry.getAddress();
console.log(`     ✓ DIDRegistry deployed at: ${didRegistryAddress}\n`);

// ── Step 2: Deploy CredentialIssuer ─────────────────────────────────────────
console.log("2/3  Deploying CredentialIssuer...");
const CredentialIssuer = await ethers.getContractFactory("CredentialIssuer");
const credentialIssuer = await CredentialIssuer.deploy(didRegistryAddress);
await credentialIssuer.waitForDeployment();
const credentialIssuerAddress = await credentialIssuer.getAddress();
console.log(`     ✓ CredentialIssuer deployed at: ${credentialIssuerAddress}\n`);

// ── Step 3: Deploy IAMAccessControl ─────────────────────────────────────────
console.log("3/3  Deploying IAMAccessControl...");
const IAMAccessControl = await ethers.getContractFactory("IAMAccessControl");
const accessControl = await IAMAccessControl.deploy(
  didRegistryAddress,
  credentialIssuerAddress
);
await accessControl.waitForDeployment();
const accessControlAddress = await accessControl.getAddress();
console.log(`     ✓ IAMAccessControl deployed at: ${accessControlAddress}\n`);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("─────────────────────────────────────────────");
console.log("  Deployment Complete!                        ");
console.log("─────────────────────────────────────────────");
console.log(`DIDRegistry:       ${didRegistryAddress}`);
console.log(`CredentialIssuer:  ${credentialIssuerAddress}`);
console.log(`IAMAccessControl:  ${accessControlAddress}`);
console.log("─────────────────────────────────────────────");
console.log("\nUpdate these addresses in:");
console.log("  → frontend/index.html  (ADDRESSES constant)");
console.log("  → README.md            (Deployed Contracts section)");