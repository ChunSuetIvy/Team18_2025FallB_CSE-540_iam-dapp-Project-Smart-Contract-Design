/**
 * Custom React hook for wallet state and connection management
 */

import { useEffect, useState, useCallback } from 'react';
import {
  connectWallet,
  disconnectWallet,
  getConnectedAddress,
  getCurrentChainId,
  isMetaMaskInstalled,
  onWalletConnected,
  onNetworkChanged,
  removeBlockchainListeners,
  isSupportedNetwork as checkSupportedNetwork,
  getNetworkName,
} from '../lib/blockchain-service';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  isSupportedNetwork: boolean;
  networkName: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    isSupportedNetwork: false,
    networkName: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!isMetaMaskInstalled()) {
          setState(prev => ({
            ...prev,
            error: 'MetaMask is not installed',
            isLoading: false,
          }));
          return;
        }

        const address = await getConnectedAddress();
        const chainId = await getCurrentChainId();
        const supported = checkSupportedNetwork(chainId);
        const networkName = getNetworkName(chainId);

        setState(prev => ({
          ...prev,
          address,
          isConnected: !!address,
          chainId,
          isSupportedNetwork: supported,
          networkName,
          isLoading: false,
        }));

        if (address) {
          onWalletConnected((newAddress) => {
            setState(prev => ({
              ...prev,
              address: newAddress,
              isConnected: true,
            }));
          });

          onNetworkChanged((chainIdHex) => {
            const newChainId = parseInt(chainIdHex, 16);
            setState(prev => ({
              ...prev,
              chainId: newChainId,
              isSupportedNetwork: checkSupportedNetwork(newChainId),
              networkName: getNetworkName(newChainId),
            }));
          });
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    };

    checkConnection();

    return () => {
      removeBlockchainListeners();
    };
  }, []);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const address = await connectWallet();
      const chainId = await getCurrentChainId();
      const supported = checkSupportedNetwork(chainId);
      const networkName = getNetworkName(chainId);

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        chainId,
        isSupportedNetwork: supported,
        networkName,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setState(prev => ({
      ...prev,
      address: null,
      isConnected: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}
