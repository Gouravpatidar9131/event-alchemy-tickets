
import { useWallet } from '@solana/wallet-adapter-react';
import { useMonadWallet } from '@/providers/MonadProvider';
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useWalletConnection = () => {
  const { connected: solanaConnected, publicKey: solanaPublicKey, disconnect: disconnectSolana } = useWallet();
  const { connected: monadConnected, publicKey: monadPublicKey, disconnect: disconnectMonad } = useMonadWallet();
  const { toast } = useToast();

  const updateUserProfile = useCallback(async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const updates: Record<string, any> = {};
      
      if (solanaConnected && solanaPublicKey) {
        updates.wallet_address = solanaPublicKey.toString();
      }
      
      if (monadConnected && monadPublicKey) {
        updates.monad_wallet_address = monadPublicKey;
      }
      
      if (Object.keys(updates).length === 0) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Wallet Connected',
        description: 'Your wallet has been linked to your account',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile with wallet address',
        variant: 'destructive',
      });
    }
  }, [solanaPublicKey, monadPublicKey, solanaConnected, monadConnected, toast]);

  const handleDisconnect = useCallback(async (walletType: 'solana' | 'monad' | 'both' = 'both') => {
    try {
      const updates: Record<string, any> = {};
      
      if (walletType === 'solana' || walletType === 'both') {
        await disconnectSolana();
        updates.wallet_address = null;
      }
      
      if (walletType === 'monad' || walletType === 'both') {
        await disconnectMonad();
        updates.monad_wallet_address = null;
      }
      
      if (Object.keys(updates).length === 0) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been unlinked from your account',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect wallet',
        variant: 'destructive',
      });
    }
  }, [disconnectSolana, disconnectMonad, toast]);

  return {
    solanaConnected,
    solanaPublicKey,
    monadConnected,
    monadPublicKey,
    updateUserProfile,
    handleDisconnect,
  };
};
