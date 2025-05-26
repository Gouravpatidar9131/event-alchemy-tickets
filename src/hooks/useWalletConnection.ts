
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useWalletConnection = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { toast } = useToast();

  const updateUserProfile = useCallback(async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const updates: Record<string, any> = {};
      
      if (connected && publicKey) {
        updates.wallet_address = publicKey.toString();
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
  }, [publicKey, connected, toast]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: null })
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
  }, [disconnect, toast]);

  return {
    connected,
    publicKey,
    updateUserProfile,
    handleDisconnect,
  };
};
