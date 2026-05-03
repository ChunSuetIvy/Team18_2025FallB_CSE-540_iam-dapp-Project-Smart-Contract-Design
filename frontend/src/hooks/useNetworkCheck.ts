/**
 * Custom React hook for network management
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getCurrentChainId,
  switchToConfiguredNetwork,
  isSupportedNetwork,
} from '../lib/blockchain-service';
import { useWallet } from './useWallet';

export interface NetworkState {
  chainId: number | null;
  isSupportedNetwork: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useNetworkCheck() {
  const wallet = useWallet();
  const [state, setState] = useState<NetworkState>({
    chainId: null,
    isSupportedNetwork: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkNetwork = async () => {
      if (!wallet.isConnected) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const chainId = await getCurrentChainId();
        const supported = isSupportedNetwork(chainId);

        setState(prev => ({
          ...prev,
          chainId,
          isSupportedNetwork: supported,
          isLoading: false,
          error: null,
        }));
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    };

    checkNetwork();
  }, [wallet.isConnected, wallet.chainId]);

  const switchNetwork = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await switchToConfiguredNetwork();
      const chainId = await getCurrentChainId();

      setState(prev => ({
        ...prev,
        chainId,
        isSupportedNetwork: true,
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

  return {
    ...state,
    switchNetwork,
  };
}
