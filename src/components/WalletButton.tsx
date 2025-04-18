
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';

const WalletButton = () => {
  const [connected, setConnected] = useState(false);

  const handleConnectWallet = () => {
    // This would normally connect to a Solana wallet
    // Using the Solana Wallet Adapter
    // For now, we'll just simulate connection
    setConnected(prev => !prev);
    
    if (!connected) {
      console.log("Wallet connected (simulated)");
    } else {
      console.log("Wallet disconnected (simulated)");
    }
  };

  return (
    <Button 
      onClick={handleConnectWallet}
      className={`rounded-full px-4 py-2 font-semibold ${
        connected 
          ? 'bg-green-500 hover:bg-green-600' 
          : 'glass-button'
      }`}
    >
      <Wallet className="w-4 h-4 mr-2" />
      {connected ? 'Wallet Connected' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletButton;
