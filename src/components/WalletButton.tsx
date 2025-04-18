
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';
import { cn } from "@/lib/utils";

const WalletButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <WalletMultiButton className={cn(
      "rounded-full px-4 py-2 font-semibold flex items-center gap-2",
      connected ? 'bg-green-500 hover:bg-green-600' : 'glass-button'
    )}>
      <Wallet className="w-4 h-4" />
      {connected ? 'Connected' : 'Connect Wallet'}
    </WalletMultiButton>
  );
};

export default WalletButton;
