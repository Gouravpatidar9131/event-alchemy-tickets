
import { useMonadWallet } from '@/providers/MonadProvider';
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';

const MonadWalletButton = () => {
  const { connected, connecting, publicKey, connect, disconnect } = useMonadWallet();
  const { user } = useAuth();

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <>
      {!user && (
        <Button asChild variant="outline" className="mr-2">
          <Link to="/auth">Sign In</Link>
        </Button>
      )}
      
      <Button
        onClick={handleClick}
        disabled={connecting}
        className={cn(
          "rounded-full px-4 py-2 font-semibold flex items-center gap-2",
          connected ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
        )}
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            {connected ? `${publicKey?.substring(0, 6)}...` : 'Connect Monad'}
          </>
        )}
      </Button>
    </>
  );
};

export default MonadWalletButton;
