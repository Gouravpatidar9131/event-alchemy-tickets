
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import MonadWalletButton from './MonadWalletButton';

const WalletButton = () => {
  const { connected, publicKey } = useWallet();
  const { updateUserProfile } = useWalletConnection();
  const { user } = useAuth();

  // If connected, update user profile with wallet address
  if (connected && publicKey && user) {
    updateUserProfile();
  }

  return (
    <div className="flex gap-2 items-center">
      {!user && (
        <Button asChild variant="outline" className="mr-2">
          <Link to="/auth">Sign In</Link>
        </Button>
      )}
      
      <WalletMultiButton className={cn(
        "rounded-full px-4 py-2 font-semibold flex items-center gap-2",
        connected ? 'bg-green-500 hover:bg-green-600' : 'glass-button'
      )}>
        <Wallet className="w-4 h-4" />
        {connected ? 'Solana' : 'Connect Solana'}
      </WalletMultiButton>
      
      <MonadWalletButton />
    </div>
  );
};

export default WalletButton;
