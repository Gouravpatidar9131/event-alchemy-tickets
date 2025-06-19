
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useCDPWallet, SUPPORTED_CHAINS } from '@/providers/CDPWalletProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  43114: 'Avalanche',
};

const CDPWalletButton = () => {
  const { accounts, isConnected, chainId, connect, disconnect, switchChain } = useCDPWallet();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in first to connect your CDP wallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      await connect();
      toast({
        title: 'Wallet Connected',
        description: 'Your CDP wallet has been connected successfully',
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to CDP wallet',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your CDP wallet has been disconnected',
    });
  };

  const handleChainSwitch = async (targetChainId: number) => {
    try {
      await switchChain(targetChainId);
      toast({
        title: 'Chain Switched',
        description: `Switched to ${CHAIN_NAMES[targetChainId]}`,
      });
    } catch (error) {
      toast({
        title: 'Chain Switch Failed',
        description: 'Failed to switch blockchain network',
        variant: 'destructive',
      });
    }
  };

  const getCurrentChainName = () => {
    return chainId ? CHAIN_NAMES[chainId] || `Chain ${chainId}` : 'Unknown';
  };

  return (
    <div className="flex gap-2 items-center">
      {!user && (
        <Button asChild variant="outline" className="mr-2">
          <Link to="/auth">Sign In</Link>
        </Button>
      )}
      
      {user && isConnected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                "rounded-full px-4 py-2 font-semibold flex items-center gap-2",
                'bg-blue-600 hover:bg-blue-700'
              )}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">
                {getCurrentChainName()} ({accounts[0]?.slice(0, 6)}...{accounts[0]?.slice(-4)})
              </span>
              <span className="sm:hidden">
                {accounts[0]?.slice(0, 6)}...
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 text-sm">
              <div className="font-medium">Connected to {getCurrentChainName()}</div>
              <div className="text-muted-foreground">{accounts[0]}</div>
            </div>
            <DropdownMenuSeparator />
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
              Switch Network
            </div>
            {Object.entries(SUPPORTED_CHAINS).map(([name, id]) => (
              <DropdownMenuItem
                key={id}
                onClick={() => handleChainSwitch(id)}
                disabled={chainId === id}
                className={cn(
                  "cursor-pointer",
                  chainId === id && "bg-accent"
                )}
              >
                {CHAIN_NAMES[id]} {chainId === id && "(Current)"}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : user ? (
        <Button
          onClick={handleConnect}
          className={cn(
            "rounded-full px-4 py-2 font-semibold flex items-center gap-2",
            'glass-button'
          )}
        >
          <Wallet className="w-4 h-4" />
          Connect CDP Wallet
        </Button>
      ) : null}
    </div>
  );
};

export default CDPWalletButton;
