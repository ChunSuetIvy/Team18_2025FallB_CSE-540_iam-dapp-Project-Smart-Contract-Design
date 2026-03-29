// ─────────────────────────────────────────────────────────────────────────────
// IAM.test.js
// Team 18 — CSE 540, Arizona State University (2025SpringB)
// Hardhat v3 test suite for DIDRegistry, CredentialIssuer, and IAMAccessControl
//
// Run with:  npx hardhat test
// ─────────────────────────────────────────────────────────────────────────────

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

// ─────────────────────────────────────────────
//  Helper: deploy all three contracts in order
// ─────────────────────────────────────────────
async function deployAll() {
  const { ethers } = await network.connect();
  const [admin, issuer, user1, user2, resourceOwner] = await ethers.getSigners();

  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();

  const CredentialIssuer = await ethers.getContractFactory("CredentialIssuer");
  const credentialIssuer = await CredentialIssuer.deploy(await didRegistry.getAddress());
  await credentialIssuer.waitForDeployment();

  const IAMAccessControl = await ethers.getContractFactory("IAMAccessControl");
  const accessControl = await IAMAccessControl.deploy(
    await didRegistry.getAddress(),
    await credentialIssuer.getAddress()
  );
  await accessControl.waitForDeployment();

  return { didRegistry, credentialIssuer, accessControl, admin, issuer, user1, user2, resourceOwner };
}

// ─────────────────────────────────────────────
//  Helper: expect a transaction to revert
// ─────────────────────────────────────────────
async function expectRevert(promise, message) {
  try {
    await promise;
    assert.fail("Expected transaction to revert but it did not");
  } catch (err) {
    if (err.message === "Expected transaction to revert but it did not") throw err;
    assert.ok(
      err.message.includes(message) || err.reason?.includes(message),
      `Expected revert with "${message}" but got: ${err.message}`
    );
  }
}

// ─────────────────────────────────────────────
//  Helper: expect an event was emitted
// ─────────────────────────────────────────────
async function expectEvent(tx, contract, eventName) {
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      return contract.interface.parseLog(log)?.name === eventName;
    } catch {
      return false;
    }
  });
  assert.ok(event, `Expected event "${eventName}" to be emitted`);
  return contract.interface.parseLog(event);
}

// ═════════════════════════════════════════════
//  1. DIDRegistry Tests
// ═════════════════════════════════════════════
describe("DIDRegistry", () => {

  it("should allow a user to register a DID", async () => {
    const { didRegistry, user1 } = await deployAll();
    const tx = await didRegistry.connect(user1).registerDID("ipfs://QmTestDID123");
    await expectEvent(tx, didRegistry, "DIDRegistered");

    const record = await didRegistry.getDID(user1.address);
    assert.equal(record.didURI, "ipfs://QmTestDID123");
    assert.equal(record.owner, user1.address);
    assert.equal(record.isActive, true);
  });

  it("should return true for isActiveDID after registration", async () => {
    const { didRegistry, user1 } = await deployAll();
    await didRegistry.connect(user1).registerDID("ipfs://QmTestDID123");
    assert.equal(await didRegistry.isActiveDID(user1.address), true);
  });

  it("should NOT allow registering a DID twice", async () => {
    const { didRegistry, user1 } = await deployAll();
    await didRegistry.connect(user1).registerDID("ipfs://QmFirst");
    await expectRevert(
      didRegistry.connect(user1).registerDID("ipfs://QmSecond"),
      "DIDRegistry: DID already registered for this address"
    );
  });

  it("should NOT allow registering with an empty URI", async () => {
    const { didRegistry, user1 } = await deployAll();
    await expectRevert(
      didRegistry.connect(user1).registerDID(""),
      "DIDRegistry: DID URI cannot be empty"
    );
  });

  it("should allow a user to update their DID URI", async () => {
    const { didRegistry, user1 } = await deployAll();
    await didRegistry.connect(user1).registerDID("ipfs://QmOld");
    const tx = await didRegistry.connect(user1).updateDID("ipfs://QmNew");
    await expectEvent(tx, didRegistry, "DIDUpdated");

    const record = await didRegistry.getDID(user1.address);
    assert.equal(record.didURI, "ipfs://QmNew");
  });

  it("should NOT allow updating a DID that was never registered", async () => {
    const { didRegistry, user1 } = await deployAll();
    await expectRevert(
      didRegistry.connect(user1).updateDID("ipfs://QmSomething"),
      "DIDRegistry: No DID registered for this address"
    );
  });

  it("should allow a user to revoke their DID", async () => {
    const { didRegistry, user1 } = await deployAll();
    await didRegistry.connect(user1).registerDID("ipfs://QmTestDID");
    const tx = await didRegistry.connect(user1).revokeDID();
    await expectEvent(tx, didRegistry, "DIDRevoked");
    assert.equal(await didRegistry.isActiveDID(user1.address), false);
  });

  it("should NOT allow updating a revoked DID", async () => {
    const { didRegistry, user1 } = await deployAll();
    await didRegistry.connect(user1).registerDID("ipfs://QmTestDID");
    await didRegistry.connect(user1).revokeDID();
    await expectRevert(
      didRegistry.connect(user1).updateDID("ipfs://QmNew"),
      "DIDRegistry: DID has been revoked"
    );
  });

  it("should return false for isActiveDID for unregistered address", async () => {
    const { didRegistry, user2 } = await deployAll();
    assert.equal(await didRegistry.isActiveDID(user2.address), false);
  });
});

// ═════════════════════════════════════════════
//  2. CredentialIssuer Tests
// ═════════════════════════════════════════════
describe("CredentialIssuer", () => {

  async function setupCredentialTest() {
    const ctx = await deployAll();
    const { didRegistry, credentialIssuer, admin, issuer, user1 } = ctx;
    await didRegistry.connect(issuer).registerDID("ipfs://QmIssuerDID");
    await didRegistry.connect(user1).registerDID("ipfs://QmUserDID");
    await credentialIssuer.connect(admin).addTrustedIssuer(issuer.address);
    return ctx;
  }

  it("should allow admin to add a trusted issuer", async () => {
    const { credentialIssuer, admin, issuer } = await deployAll();
    const tx = await credentialIssuer.connect(admin).addTrustedIssuer(issuer.address);
    await expectEvent(tx, credentialIssuer, "IssuerAdded");
    assert.equal(await credentialIssuer.isTrustedIssuer(issuer.address), true);
  });

  it("should NOT allow non-admin to add a trusted issuer", async () => {
    const { credentialIssuer, user1, issuer } = await deployAll();
    await expectRevert(
      credentialIssuer.connect(user1).addTrustedIssuer(issuer.address),
      "CredentialIssuer: Caller is not the admin"
    );
  });

  it("should allow a trusted issuer to issue a credential", async () => {
    const { credentialIssuer, issuer, user1 } = await setupCredentialTest();
    const tx = await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "DegreeCredential", "ipfs://QmCredMetadata", 0
    );
    await expectEvent(tx, credentialIssuer, "CredentialIssued");

    const cred = await credentialIssuer.getCredential(1);
    assert.equal(cred.subject, user1.address);
    assert.equal(cred.credentialType, "DegreeCredential");
    assert.equal(cred.isRevoked, false);
  });

  it("should NOT allow an untrusted address to issue a credential", async () => {
    const { credentialIssuer, user2, user1 } = await setupCredentialTest();
    await expectRevert(
      credentialIssuer.connect(user2).issueCredential(
        user1.address, "DegreeCredential", "ipfs://QmTest", 0
      ),
      "CredentialIssuer: Caller is not a trusted issuer"
    );
  });

  it("should NOT issue a credential to an address without an active DID", async () => {
    const { credentialIssuer, issuer, user2 } = await setupCredentialTest();
    await expectRevert(
      credentialIssuer.connect(issuer).issueCredential(
        user2.address, "DegreeCredential", "ipfs://QmTest", 0
      ),
      "CredentialIssuer: Subject does not have an active DID"
    );
  });

  it("should verify a valid credential as true", async () => {
    const { credentialIssuer, issuer, user1 } = await setupCredentialTest();
    await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "DegreeCredential", "ipfs://QmMeta", 0
    );
    assert.equal(await credentialIssuer.verifyCredential(1), true);
  });

  it("should verify a revoked credential as false", async () => {
    const { credentialIssuer, issuer, user1 } = await setupCredentialTest();
    await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "DegreeCredential", "ipfs://QmMeta", 0
    );
    await credentialIssuer.connect(issuer).revokeCredential(1);
    assert.equal(await credentialIssuer.verifyCredential(1), false);
  });

  it("should NOT allow someone other than the issuer to revoke", async () => {
    const { credentialIssuer, issuer, user1, user2 } = await setupCredentialTest();
    await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "DegreeCredential", "ipfs://QmMeta", 0
    );
    await expectRevert(
      credentialIssuer.connect(user2).revokeCredential(1),
      "CredentialIssuer: Only the original issuer can revoke"
    );
  });

  it("should return all credential IDs for a subject", async () => {
    const { credentialIssuer, issuer, user1 } = await setupCredentialTest();
    await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "DegreeCredential", "ipfs://QmMeta1", 0
    );
    await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "EmploymentCredential", "ipfs://QmMeta2", 0
    );
    const ids = await credentialIssuer.getCredentialsBySubject(user1.address);
    assert.equal(ids.length, 2);
  });

  it("should allow admin to remove a trusted issuer", async () => {
    const { credentialIssuer, admin, issuer } = await deployAll();
    await credentialIssuer.connect(admin).addTrustedIssuer(issuer.address);
    const tx = await credentialIssuer.connect(admin).removeTrustedIssuer(issuer.address);
    await expectEvent(tx, credentialIssuer, "IssuerRemoved");
    assert.equal(await credentialIssuer.isTrustedIssuer(issuer.address), false);
  });
});

// ═════════════════════════════════════════════
//  3. IAMAccessControl Tests
// ═════════════════════════════════════════════
describe("IAMAccessControl", () => {

  async function setupAccessTest() {
    const ctx = await deployAll();
    const { didRegistry, credentialIssuer, accessControl, admin, issuer, user1, resourceOwner } = ctx;

    await didRegistry.connect(issuer).registerDID("ipfs://QmIssuerDID");
    await didRegistry.connect(user1).registerDID("ipfs://QmUserDID");
    await didRegistry.connect(resourceOwner).registerDID("ipfs://QmOwnerDID");
    await credentialIssuer.connect(admin).addTrustedIssuer(issuer.address);
    await credentialIssuer.connect(issuer).issueCredential(
      user1.address, "DegreeCredential", "ipfs://QmCredMeta", 0
    );
    await accessControl.connect(resourceOwner).registerResource(
      "University Portal", "DegreeCredential"
    );

    return { ...ctx, credentialId: 1n, resourceId: 1n };
  }

  it("should allow a DID holder to register a resource", async () => {
    const { accessControl, resourceOwner } = await setupAccessTest();
    const tx = await accessControl.connect(resourceOwner).registerResource("New Resource", "");
    await expectEvent(tx, accessControl, "ResourceRegistered");

    const resource = await accessControl.getResource(2);
    assert.equal(resource.name, "New Resource");
    assert.equal(resource.owner, resourceOwner.address);
  });

  it("should NOT allow registering a resource without an active DID", async () => {
    const { accessControl, user2 } = await setupAccessTest();
    await expectRevert(
      accessControl.connect(user2).registerResource("Test", ""),
      "AccessControl: Caller does not have an active DID"
    );
  });

  it("should grant a role to a user with a valid credential", async () => {
    const { accessControl, resourceOwner, user1, resourceId, credentialId } = await setupAccessTest();
    const tx = await accessControl.connect(resourceOwner).grantRole(
      resourceId, user1.address, "VIEWER", credentialId
    );
    await expectEvent(tx, accessControl, "RoleGranted");
    assert.equal(await accessControl.hasRole(resourceId, user1.address, "VIEWER"), true);
  });

  it("should NOT grant a role if credential type does not match", async () => {
    const { accessControl, credentialIssuer, didRegistry, resourceOwner, issuer, user2, resourceId } = await setupAccessTest();
    await didRegistry.connect(user2).registerDID("ipfs://QmUser2DID");
    await credentialIssuer.connect(issuer).issueCredential(
      user2.address, "EmploymentCredential", "ipfs://QmWrongCred", 0
    );
    await expectRevert(
      accessControl.connect(resourceOwner).grantRole(resourceId, user2.address, "VIEWER", 2n),
      "AccessControl: Credential type does not match resource requirement"
    );
  });

  it("should NOT grant a role to a user without an active DID", async () => {
    const { accessControl, resourceOwner, user2, resourceId, credentialId } = await setupAccessTest();
    await expectRevert(
      accessControl.connect(resourceOwner).grantRole(resourceId, user2.address, "VIEWER", credentialId),
      "AccessControl: Account does not have an active DID"
    );
  });

  it("should allow resource owner to revoke a role", async () => {
    const { accessControl, resourceOwner, user1, resourceId, credentialId } = await setupAccessTest();
    await accessControl.connect(resourceOwner).grantRole(resourceId, user1.address, "VIEWER", credentialId);
    const tx = await accessControl.connect(resourceOwner).revokeRole(resourceId, user1.address, "VIEWER");
    await expectEvent(tx, accessControl, "RoleRevoked");
    assert.equal(await accessControl.hasRole(resourceId, user1.address, "VIEWER"), false);
  });

  it("should NOT allow a non-owner to grant roles", async () => {
    const { accessControl, user2, user1, resourceId, credentialId } = await setupAccessTest();
    await expectRevert(
      accessControl.connect(user2).grantRole(resourceId, user1.address, "VIEWER", credentialId),
      "AccessControl: Caller is not the resource owner"
    );
  });

  it("should return false for hasRole when role was never granted", async () => {
    const { accessControl, user1, resourceId } = await setupAccessTest();
    assert.equal(await accessControl.hasRole(resourceId, user1.address, "ADMIN"), false);
  });

  it("should allow granting role on resource with no credential requirement", async () => {
    const { accessControl, resourceOwner, user1 } = await setupAccessTest();
    await accessControl.connect(resourceOwner).registerResource("Open Resource", "");
    const tx = await accessControl.connect(resourceOwner).grantRole(2n, user1.address, "VIEWER", 0n);
    await expectEvent(tx, accessControl, "RoleGranted");
  });

  it("should emit AccessChecked event on checkAndLogAccess", async () => {
    const { accessControl, resourceOwner, user1, resourceId, credentialId } = await setupAccessTest();
    await accessControl.connect(resourceOwner).grantRole(resourceId, user1.address, "VIEWER", credentialId);
    const tx = await accessControl.connect(user1).checkAndLogAccess(resourceId, "VIEWER");
    const event = await expectEvent(tx, accessControl, "AccessChecked");
    assert.equal(event.args.granted, true);
  });

  it("should allow deactivating a resource", async () => {
    const { accessControl, resourceOwner, resourceId } = await setupAccessTest();
    const tx = await accessControl.connect(resourceOwner).deactivateResource(resourceId);
    await expectEvent(tx, accessControl, "ResourceDeactivated");
  });
});