
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';

const WalletButton = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { updateUserProfile } = useWalletConnection();
  const { user } = useAuth();

  // If connected, update user profile with wallet address
  if (isConnected && address && user) {
    updateUserProfile();
  }

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      // Connect with the first available connector (MetaMask, WalletConnect, etc.)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {!user && (
        <Button asChild variant="outline" className="mr-2">
          <Link to="/auth">Sign In</Link>
        </Button>
      )}
      
      <Button
        onClick={handleConnect}
        className={cn(
          "rounded-full px-4 py-2 font-semibold flex items-center gap-2",
          isConnected ? 'bg-green-500 hover:bg-green-600' : 'glass-button'
        )}
      >
        <Wallet className="w-4 h-4" />
        {isConnected ? `Connected (${address?.slice(0, 6)}...${address?.slice(-4)})` : 'Connect Wallet'}
      </Button>
    </div>
  );
};

export default WalletButton;
