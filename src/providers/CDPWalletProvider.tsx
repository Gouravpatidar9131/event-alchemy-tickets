
import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { WalletSDK } from '@coinbase/wallet-sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface CDPWalletContextType {
  wallet: any;
  provider: any;
  accounts: string[];
  isConnected: boolean;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const CDPWalletContext = createContext<CDPWalletContextType | null>(null);

interface CDPWalletProviderProps {
  children: ReactNode;
}

const SUPPORTED_CHAINS = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  avalanche: 43114,
};

const queryClient = new QueryClient();

export const CDPWalletProvider: React.FC<CDPWalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    // Initialize CDP Wallet SDK
    const walletSDK = new WalletSDK({
      appName: 'Event Ticketing DApp',
      appLogoUrl: 'https://family.co/logo.png',
      darkMode: false,
    });

    const newWallet = walletSDK.makeWeb3Provider({
      options: 'all',
    });

    setWallet(newWallet);
    setProvider(newWallet);

    // Check if already connected
    checkConnection(newWallet);

    // Listen for account changes
    newWallet.on('accountsChanged', (accounts: string[]) => {
      console.log('CDP Wallet: Accounts changed', accounts);
      setAccounts(accounts);
      setIsConnected(accounts.length > 0);
    });

    // Listen for chain changes
    newWallet.on('chainChanged', (chainId: string) => {
      console.log('CDP Wallet: Chain changed', chainId);
      setChainId(parseInt(chainId, 16));
    });

    return () => {
      if (newWallet) {
        newWallet.removeAllListeners();
      }
    };
  }, []);

  const checkConnection = async (walletProvider: any) => {
    try {
      const accounts = await walletProvider.request({
        method: 'eth_accounts',
      });
      
      if (accounts.length > 0) {
        setAccounts(accounts);
        setIsConnected(true);
        
        const chainId = await walletProvider.request({
          method: 'eth_chainId',
        });
        setChainId(parseInt(chainId, 16));
      }
    } catch (error) {
      console.error('CDP Wallet: Error checking connection', error);
    }
  };

  const connect = async () => {
    if (!provider) return;

    try {
      console.log('CDP Wallet: Connecting...');
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      
      setAccounts(accounts);
      setIsConnected(true);
      
      const chainId = await provider.request({
        method: 'eth_chainId',
      });
      setChainId(parseInt(chainId, 16));
      
      console.log('CDP Wallet: Connected successfully', accounts);
    } catch (error) {
      console.error('CDP Wallet: Connection failed', error);
      throw error;
    }
  };

  const disconnect = () => {
    setAccounts([]);
    setIsConnected(false);
    setChainId(null);
    console.log('CDP Wallet: Disconnected');
  };

  const switchChain = async (targetChainId: number) => {
    if (!provider) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      setChainId(targetChainId);
    } catch (error: any) {
      console.error('CDP Wallet: Chain switch failed', error);
      throw error;
    }
  };

  const value = {
    wallet,
    provider,
    accounts,
    isConnected,
    chainId,
    connect,
    disconnect,
    switchChain,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <CDPWalletContext.Provider value={value}>
        {children}
      </CDPWalletContext.Provider>
    </QueryClientProvider>
  );
};

export const useCDPWallet = () => {
  const context = useContext(CDPWalletContext);
  if (!context) {
    throw new Error('useCDPWallet must be used within CDPWalletProvider');
  }
  return context;
};

export { SUPPORTED_CHAINS };
