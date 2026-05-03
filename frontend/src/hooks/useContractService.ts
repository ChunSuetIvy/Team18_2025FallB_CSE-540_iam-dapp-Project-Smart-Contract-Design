/**
 * Custom React hook for contract interactions
 * Wraps all blockchain calls with error handling and loading states
 */

import { useState } from 'react';
import {
  getContractInstance,
  getReadOnlyContractInstance,
  submitTransaction,
} from '../lib/blockchain-service';
import { parseRevertReason, getFriendlyErrorMessage } from '../lib/error-handler';
import { isValidAddress } from '../lib/address-utils';
import { DIDRecord, Credential, Resource } from '../types/contracts';

export interface ContractServiceState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export function useContractService() {
  const [state, setState] = useState<ContractServiceState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  // ─────────────────────────────────────────────
  // DIDRegistry Functions
  // ─────────────────────────────────────────────

  const registerDID = async (didURI: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!didURI || didURI.trim() === '') {
        throw new Error('DID URI cannot be empty');
      }

      const contract = await getContractInstance('DIDRegistry');
      const tx = await contract.registerDID(didURI);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const updateDID = async (newDIDURI: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!newDIDURI || newDIDURI.trim() === '') {
        throw new Error('New DID URI cannot be empty');
      }

      const contract = await getContractInstance('DIDRegistry');
      const tx = await contract.updateDID(newDIDURI);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const revokeDID = async () => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getContractInstance('DIDRegistry');
      const tx = await contract.revokeDID();
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const getDID = async (ownerAddress: string): Promise<DIDRecord | null> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(ownerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('DIDRegistry');
      const result = await contract.getDID(ownerAddress);

      setState({ isLoading: false, error: null, txHash: null });
      return {
        didURI: result.didURI,
        owner: result.owner,
        createdAt: Number(result.createdAt),
        updatedAt: Number(result.updatedAt),
        isActive: result.isActive,
      };
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const isActiveDID = async (ownerAddress: string): Promise<boolean> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(ownerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('DIDRegistry');
      const result = await contract.isActiveDID(ownerAddress);

      setState({ isLoading: false, error: null, txHash: null });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const getDIDURI = async (ownerAddress: string): Promise<string | null> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(ownerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('DIDRegistry');
      const result = await contract.getDIDURI(ownerAddress);

      setState({ isLoading: false, error: null, txHash: null });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  // ─────────────────────────────────────────────
  // CredentialIssuer Functions
  // ─────────────────────────────────────────────

  const addTrustedIssuer = async (issuerAddress: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(issuerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getContractInstance('CredentialIssuer');
      const tx = await contract.addTrustedIssuer(issuerAddress);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const removeTrustedIssuer = async (issuerAddress: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(issuerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getContractInstance('CredentialIssuer');
      const tx = await contract.removeTrustedIssuer(issuerAddress);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const issueCredential = async (
    subjectAddress: string,
    credentialType: string,
    metadataURI: string,
    expiresAt: number
  ) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(subjectAddress)) {
        throw new Error('Invalid subject address');
      }
      if (!credentialType || credentialType.trim() === '') {
        throw new Error('Credential type cannot be empty');
      }
      if (expiresAt > 0 && expiresAt <= Math.floor(Date.now() / 1000)) {
        throw new Error('Expiry time must be in the future');
      }

      const contract = await getContractInstance('CredentialIssuer');
      const tx = await contract.issueCredential(subjectAddress, credentialType, metadataURI, expiresAt);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const revokeCredential = async (credentialId: number) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getContractInstance('CredentialIssuer');
      const tx = await contract.revokeCredential(credentialId);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const getCredential = async (credentialId: number): Promise<Credential | null> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getReadOnlyContractInstance('CredentialIssuer');
      const result = await contract.getCredential(credentialId);

      setState({ isLoading: false, error: null, txHash: null });
      return {
        credentialId: Number(result.credentialId),
        issuer: result.issuer,
        subject: result.subject,
        credentialType: result.credentialType,
        metadataURI: result.metadataURI,
        issuedAt: Number(result.issuedAt),
        expiresAt: Number(result.expiresAt),
        isRevoked: result.isRevoked,
      };
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const verifyCredential = async (credentialId: number): Promise<boolean> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getReadOnlyContractInstance('CredentialIssuer');
      const result = await contract.verifyCredential(credentialId);

      setState({ isLoading: false, error: null, txHash: null });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const getCredentialsBySubject = async (subjectAddress: string): Promise<number[]> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(subjectAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('CredentialIssuer');
      const result = await contract.getCredentialsBySubject(subjectAddress);

      setState({ isLoading: false, error: null, txHash: null });
      return result.map((id: any) => Number(id));
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const isTrustedIssuer = async (issuerAddress: string): Promise<boolean> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(issuerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('CredentialIssuer');
      const result = await contract.isTrustedIssuer(issuerAddress);

      setState({ isLoading: false, error: null, txHash: null });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  // ─────────────────────────────────────────────
  // IAMAccessControl Functions
  // ─────────────────────────────────────────────

  const registerResource = async (name: string, requiredCredentialType: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!name || name.trim() === '') {
        throw new Error('Resource name cannot be empty');
      }

      const contract = await getContractInstance('IAMAccessControl');
      const tx = await contract.registerResource(name, requiredCredentialType);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const deactivateResource = async (resourceId: number) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getContractInstance('IAMAccessControl');
      const tx = await contract.deactivateResource(resourceId);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const grantRole = async (resourceId: number, accountAddress: string, role: string, credentialId: number) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(accountAddress)) {
        throw new Error('Invalid account address');
      }
      if (!role || role.trim() === '') {
        throw new Error('Role cannot be empty');
      }

      const contract = await getContractInstance('IAMAccessControl');
      const tx = await contract.grantRole(resourceId, accountAddress, role, credentialId);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const revokeRole = async (resourceId: number, accountAddress: string, role: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(accountAddress)) {
        throw new Error('Invalid account address');
      }

      const contract = await getContractInstance('IAMAccessControl');
      const tx = await contract.revokeRole(resourceId, accountAddress, role);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const hasRole = async (resourceId: number, accountAddress: string, role: string): Promise<boolean> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(accountAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('IAMAccessControl');
      const result = await contract.hasRole(resourceId, accountAddress, role);

      setState({ isLoading: false, error: null, txHash: null });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const checkAndLogAccess = async (resourceId: number, role: string) => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getContractInstance('IAMAccessControl');
      const tx = await contract.checkAndLogAccess(resourceId, role);
      const result = await submitTransaction(tx);

      setState({
        isLoading: false,
        error: null,
        txHash: result.hash,
      });
      return result;
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const getResource = async (resourceId: number): Promise<Resource | null> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      const contract = await getReadOnlyContractInstance('IAMAccessControl');
      const result = await contract.getResource(resourceId);

      setState({ isLoading: false, error: null, txHash: null });
      return {
        resourceId: Number(result.resourceId),
        owner: result.owner,
        name: result.name,
        requiredCredentialType: result.requiredCredentialType,
        isActive: result.isActive,
      };
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  const getResourcesByOwner = async (ownerAddress: string): Promise<number[]> => {
    setState({ isLoading: true, error: null, txHash: null });
    try {
      if (!isValidAddress(ownerAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const contract = await getReadOnlyContractInstance('IAMAccessControl');
      const result = await contract.getResourcesByOwner(ownerAddress);

      setState({ isLoading: false, error: null, txHash: null });
      return result.map((id: any) => Number(id));
    } catch (error: any) {
      const errorMsg = getFriendlyErrorMessage(parseRevertReason(error));
      setState({ isLoading: false, error: errorMsg, txHash: null });
      throw error;
    }
  };

  return {
    state,
    // DID Registry
    registerDID,
    updateDID,
    revokeDID,
    getDID,
    isActiveDID,
    getDIDURI,
    // Credential Issuer
    addTrustedIssuer,
    removeTrustedIssuer,
    issueCredential,
    revokeCredential,
    getCredential,
    verifyCredential,
    getCredentialsBySubject,
    isTrustedIssuer,
    // Access Control
    registerResource,
    deactivateResource,
    grantRole,
    revokeRole,
    hasRole,
    checkAndLogAccess,
    getResource,
    getResourcesByOwner,
  };
}
