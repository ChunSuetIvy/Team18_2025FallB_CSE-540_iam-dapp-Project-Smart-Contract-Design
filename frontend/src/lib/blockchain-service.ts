/**
 * Core blockchain service layer
 * Handles wallet connection, network switching, contract interactions
 */

import { BrowserProvider, Contract } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
  getNetworkConfigByChainId,
  SupportedNetwork,
  DID_REGISTRY_ABI,
  CREDENTIAL_ISSUER_ABI,
  ACCESS_CONTROL_ABI,
} from './contract-config';
import { parseRevertReason, getFriendlyErrorMessage } from './error-handler';

/**
 * Get the window.ethereum provider (MetaMask)
 */
export function getEthereumProvider() {
  return (window as any).ethereum;
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return Boolean(getEthereumProvider());
}

/**
 * Connect to MetaMask
 */
export async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install it to use this app.');
  }

  try {
    const accounts = await getEthereumProvider().request({
      method: 'eth_requestAccounts',
    });

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    throw new Error('No accounts returned from MetaMask');
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('You rejected the connection request');
    }
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

/**
 * Disconnect wallet (clear provider connection)
 */
export async function disconnectWallet() {
  return true;
}

/**
 * Get the current connected address
 */
export async function getConnectedAddress(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;

  try {
    const provider = new BrowserProvider(getEthereumProvider());
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch {
    return null;
  }
}

/**
 * Get the current chain ID
 */
export async function getCurrentChainId(): Promise<number | null> {
  if (!isMetaMaskInstalled()) return null;

  try {
    const provider = new BrowserProvider(getEthereumProvider());
    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch {
    return null;
  }
}

/**
 * Get the current connected network name for the given chain ID.
 */
export function getNetworkName(chainId: number | null): string {
  const config = getNetworkConfigByChainId(chainId);
  if (!config) {
    return chainId === null ? 'Unknown network' : `Chain ${chainId}`;
  }
  return config.name;
}

/**
 * Check whether the current chain ID is supported by this frontend.
 */
export function isSupportedNetwork(chainId: number | null): boolean {
  return getNetworkConfigByChainId(chainId) !== null;
}

/**
 * Switch network to the configured target option.
 */
export async function switchToConfiguredNetwork() {
  return switchToNetwork(NETWORK_CONFIG);
}

export async function switchToNetwork(targetNetwork: SupportedNetwork) {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await getEthereumProvider().request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      const chainParams: any = {
        chainId: `0x${targetNetwork.chainId.toString(16)}`,
        chainName: targetNetwork.name,
        rpcUrls: [targetNetwork.rpcUrl],
        nativeCurrency: {
          name: targetNetwork.currency,
          symbol: targetNetwork.currency,
          decimals: 18,
        },
      };

      if (targetNetwork.explorerUrl) {
        chainParams.blockExplorerUrls = [targetNetwork.explorerUrl];
      }

      try {
        await getEthereumProvider().request({
          method: 'wallet_addEthereumChain',
          params: [chainParams],
        });
      } catch (addError: any) {
        throw new Error(`Failed to add ${targetNetwork.name} network to MetaMask`);
      }
    } else {
      throw new Error(`Failed to switch network: ${error.message}`);
    }
  }
}

/**
 * Get a contract instance (requires connected wallet on correct network)
 */
export async function getContractInstance(contractName: 'DIDRegistry' | 'CredentialIssuer' | 'IAMAccessControl') {
  const provider = new BrowserProvider(getEthereumProvider());
  const signer = await provider.getSigner();

  const address = CONTRACT_ADDRESSES[contractName];
  if (!address) {
    throw new Error(`${contractName} address not configured in .env`);
  }

  let abi: string[];
  switch (contractName) {
    case 'DIDRegistry':
      abi = DID_REGISTRY_ABI;
      break;
    case 'CredentialIssuer':
      abi = CREDENTIAL_ISSUER_ABI;
      break;
    case 'IAMAccessControl':
      abi = ACCESS_CONTROL_ABI;
      break;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }

  return new Contract(address, abi, signer);
}

/**
 * Get a read-only contract instance (no signer needed for view calls)
 */
export async function getReadOnlyContractInstance(contractName: 'DIDRegistry' | 'CredentialIssuer' | 'IAMAccessControl') {
  const provider = new BrowserProvider(getEthereumProvider());

  const address = CONTRACT_ADDRESSES[contractName];
  if (!address) {
    throw new Error(`${contractName} address not configured in .env`);
  }

  let abi: string[];
  switch (contractName) {
    case 'DIDRegistry':
      abi = DID_REGISTRY_ABI;
      break;
    case 'CredentialIssuer':
      abi = CREDENTIAL_ISSUER_ABI;
      break;
    case 'IAMAccessControl':
      abi = ACCESS_CONTROL_ABI;
      break;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }

  return new Contract(address, abi, provider);
}

/**
 * Submit a transaction and wait for confirmation
 */
export async function submitTransaction(tx: any) {
  try {
    const receipt = await tx.wait();
    return {
      hash: tx.hash || receipt?.transactionHash,
      confirmed: true,
      blockNumber: receipt?.blockNumber,
    };
  } catch (error) {
    const errorMsg = parseRevertReason(error);
    throw new Error(getFriendlyErrorMessage(errorMsg));
  }
}

/**
 * Get the explorer URL for a transaction, if supported.
 */
export function getExplorerTxUrl(hash: string, chainId: number | null): string | null {
  const config = getNetworkConfigByChainId(chainId) ?? NETWORK_CONFIG;
  return config.explorerUrl ? `${config.explorerUrl}/tx/${hash}` : null;
}

/**
 * Listen to wallet connection changes
 */
export function onWalletConnected(callback: (address: string) => void) {
  if (!isMetaMaskInstalled()) return;

  getEthereumProvider().on('accountsChanged', (accounts: string[]) => {
    if (accounts.length > 0) {
      callback(accounts[0]);
    }
  });
}

/**
 * Listen to network changes
 */
export function onNetworkChanged(callback: (chainId: string) => void) {
  if (!isMetaMaskInstalled()) return;

  getEthereumProvider().on('chainChanged', callback);
}

/**
 * Remove all event listeners
 */
export function removeBlockchainListeners() {
  if (!isMetaMaskInstalled()) return;

  const provider = getEthereumProvider();
  provider.removeAllListeners('accountsChanged');
  provider.removeAllListeners('chainChanged');
}
