
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

// Define the MonadWallet interface
interface MonadWallet {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (amount: number, recipient: string) => Promise<string>;
}

// Create the context
const MonadWalletContext = createContext<MonadWallet | undefined>(undefined);

export function useMonadWallet(): MonadWallet {
  const context = useContext(MonadWalletContext);
  if (context === undefined) {
    throw new Error('useMonadWallet must be used within a MonadProvider');
  }
  return context;
}

interface MonadProviderProps {
  children: ReactNode;
}

export function MonadProvider({ children }: MonadProviderProps) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();

  // Mock wallets for testing
  const MOCK_WALLETS = [
    "monad1qgx47fj03vx9069r0gvpna867arhpn3qvzl4je",
    "monad1t6vhntxwu0mj99z7jydmehh29y9e9k5yxfskz3",
    "monad14kzd5tzp36ksg566qhvc5hl4eavs5za4pc8wkl"
  ];

  // Connect to wallet
  const connect = async () => {
    try {
      setConnecting(true);
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random wallet address from our mock list
      const randomWallet = MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];
      setPublicKey(randomWallet);
      setConnected(true);
      
      // Update user profile if logged in
      if (user) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ monad_wallet_address: randomWallet })
            .eq('id', user.id);

          if (error) throw error;
          
          toast('Monad Wallet Connected', {
            description: 'Your Monad wallet has been linked to your account'
          });
        } catch (error: any) {
          console.error('Error updating profile with Monad wallet:', error);
          toast('Error', {
            description: 'Failed to update profile with Monad wallet address'
          });
        }
      }
    } catch (error: any) {
      console.error('Error connecting to Monad wallet:', error);
      toast('Connection Failed', {
        description: 'Failed to connect to Monad wallet'
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from wallet
  const disconnect = async () => {
    try {
      // Simulate disconnection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setPublicKey(null);
      setConnected(false);
      
      // Update user profile if logged in
      if (user) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ monad_wallet_address: null })
            .eq('id', user.id);

          if (error) throw error;
          
          toast('Monad Wallet Disconnected', {
            description: 'Your Monad wallet has been unlinked from your account'
          });
        } catch (error: any) {
          console.error('Error updating profile after Monad disconnect:', error);
        }
      }
    } catch (error: any) {
      console.error('Error disconnecting from Monad wallet:', error);
      toast('Disconnection Failed', {
        description: 'Failed to disconnect from Monad wallet'
      });
    }
  };

  // Send a transaction (mock implementation)
  const sendTransaction = async (amount: number, recipient: string): Promise<string> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const txHash = 'monad_tx_' + Math.random().toString(36).substring(2, 15);
      
      toast('Transaction Sent', {
        description: `Sent ${amount} MONAD to ${recipient.substring(0, 8)}...`
      });
      
      return txHash;
    } catch (error: any) {
      console.error('Error sending Monad transaction:', error);
      throw new Error(error.message || 'Failed to send transaction');
    }
  };

  const wallet: MonadWallet = {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    sendTransaction
  };

  return (
    <MonadWalletContext.Provider value={wallet}>
      {children}
    </MonadWalletContext.Provider>
  );
}
