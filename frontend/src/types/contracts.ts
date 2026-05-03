// TypeScript interfaces for smart contract structs and returns

/// <reference types="vite/client" />

export interface DIDRecord {
  didURI: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface Credential {
  credentialId: number;
  issuer: string;
  subject: string;
  credentialType: string;
  metadataURI: string;
  issuedAt: number;
  expiresAt: number;
  isRevoked: boolean;
}

export interface Resource {
  resourceId: number;
  owner: string;
  name: string;
  requiredCredentialType: string;
  isActive: boolean;
}

export interface RoleGrant {
  account: string;
  role: string;
  grantedAt: number;
  isActive: boolean;
}

// UI state types
export interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: number;
}

export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}
