export type SupportedNetworkKey = 'POLYGON_AMOY' | 'HARDHAT_LOCAL';

export interface SupportedNetwork {
  key: SupportedNetworkKey;
  chainId: number;
  name: string;
  rpcUrl: string;
  currency: string;
  explorerUrl: string | null;
}

const rawTargetNetwork = import.meta.env.VITE_TARGET_NETWORK as string | undefined;
export const DEFAULT_NETWORK_KEY: SupportedNetworkKey =
  rawTargetNetwork?.toUpperCase() === 'HARDHAT_LOCAL' ? 'HARDHAT_LOCAL' : 'POLYGON_AMOY';

export const NETWORK_CONFIGS: Record<SupportedNetworkKey, SupportedNetwork> = {
  POLYGON_AMOY: {
    key: 'POLYGON_AMOY',
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: import.meta.env.VITE_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
    currency: 'MATIC',
    explorerUrl: 'https://www.oklink.com/amoy',
  },
  HARDHAT_LOCAL: {
    key: 'HARDHAT_LOCAL',
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: import.meta.env.VITE_HARDHAT_RPC || 'http://127.0.0.1:8545',
    currency: 'ETH',
    explorerUrl: null,
  },
};

export const NETWORK_CONFIG = NETWORK_CONFIGS[DEFAULT_NETWORK_KEY];

export function getNetworkConfigByChainId(chainId: number | null): SupportedNetwork | null {
  if (chainId === null) return null;
  return Object.values(NETWORK_CONFIGS).find((network) => network.chainId === chainId) ?? null;
}

export function isSupportedNetwork(chainId: number | null): boolean {
  return getNetworkConfigByChainId(chainId) !== null;
}

/**
 * Contract addresses loaded from environment variables
 * Update your .env file with deployed contract addresses
 */
export const CONTRACT_ADDRESSES = {
  DIDRegistry: import.meta.env.VITE_DID_REGISTRY_ADDRESS || '',
  CredentialIssuer: import.meta.env.VITE_CREDENTIAL_ISSUER_ADDRESS || '',
  IAMAccessControl: import.meta.env.VITE_ACCESS_CONTROL_ADDRESS || '',
};

/**
 * Contract ABIs (minimal - only needed functions)
 */

export const DID_REGISTRY_ABI = [
  'function registerDID(string calldata _didURI) external',
  'function updateDID(string calldata _newDIDURI) external',
  'function revokeDID() external',
  'function getDID(address _owner) external view returns (tuple(string didURI, address owner, uint256 createdAt, uint256 updatedAt, bool isActive))',
  'function isActiveDID(address _owner) external view returns (bool)',
  'function getDIDURI(address _owner) external view returns (string)',
];

export const CREDENTIAL_ISSUER_ABI = [
  'function addTrustedIssuer(address _issuer) external',
  'function removeTrustedIssuer(address _issuer) external',
  'function issueCredential(address _subject, string calldata _credentialType, string calldata _metadataURI, uint256 _expiresAt) external returns (uint256 credentialId)',
  'function revokeCredential(uint256 _credentialId) external',
  'function getCredential(uint256 _credentialId) external view returns (tuple(uint256 credentialId, address issuer, address subject, string credentialType, string metadataURI, uint256 issuedAt, uint256 expiresAt, bool isRevoked))',
  'function verifyCredential(uint256 _credentialId) external view returns (bool)',
  'function getCredentialsBySubject(address _subject) external view returns (uint256[])',
  'function isTrustedIssuer(address _issuer) external view returns (bool)',
  'function getCredentialType(uint256 _credentialId) external view returns (string)',
  'function getCredentialSubject(uint256 _credentialId) external view returns (address)',
];

export const ACCESS_CONTROL_ABI = [
  'function registerResource(string calldata _name, string calldata _requiredCredentialType) external returns (uint256 resourceId)',
  'function deactivateResource(uint256 _resourceId) external',
  'function grantRole(uint256 _resourceId, address _account, string calldata _role, uint256 _credentialId) external',
  'function revokeRole(uint256 _resourceId, address _account, string calldata _role) external',
  'function hasRole(uint256 _resourceId, address _account, string calldata _role) external view returns (bool)',
  'function checkAndLogAccess(uint256 _resourceId, string calldata _role) external returns (bool granted)',
  'function getResource(uint256 _resourceId) external view returns (tuple(uint256 resourceId, address owner, string name, string requiredCredentialType, bool isActive))',
  'function getResourcesByOwner(address _owner) external view returns (uint256[])',
  'function getRoleGrant(uint256 _resourceId, address _account, string calldata _role) external view returns (tuple(address account, string role, uint256 grantedAt, bool isActive))',
];

/**
 * Validate that all required contract addresses are set
 */
export function validateContractAddresses(): boolean {
  return (
    CONTRACT_ADDRESSES.DIDRegistry !== '' &&
    CONTRACT_ADDRESSES.CredentialIssuer !== '' &&
    CONTRACT_ADDRESSES.IAMAccessControl !== ''
  );
}

export function getMissingAddresses(): string[] {
  const missing: string[] = [];
  if (!CONTRACT_ADDRESSES.DIDRegistry) missing.push('DIDRegistry');
  if (!CONTRACT_ADDRESSES.CredentialIssuer) missing.push('CredentialIssuer');
  if (!CONTRACT_ADDRESSES.IAMAccessControl) missing.push('IAMAccessControl');
  return missing;
}
