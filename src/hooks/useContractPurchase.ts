
import { useState } from 'react';
import { useCDPWallet } from '@/providers/CDPWalletProvider';
import { contractService, ContractTicketPurchase } from '@/services/contractService';
import { useToast } from '@/components/ui/use-toast';

export const useContractPurchase = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { provider, accounts, chainId, isConnected } = useCDPWallet();
  const { toast } = useToast();

  const purchaseTicketWithContract = async (params: {
    eventId: string;
    ticketType: string;
    quantity: number;
    priceInEth: number;
  }) => {
    if (!isConnected || !provider || !accounts.length || !chainId) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    
    try {
      // Initialize contract service
      await contractService.initialize(provider, chainId);
      
      // Prepare contract purchase parameters
      const contractParams: ContractTicketPurchase = {
        eventId: params.eventId,
        ticketType: params.ticketType,
        quantity: params.quantity,
        priceInWei: contractService.priceToWei(params.priceInEth),
        buyerAddress: accounts[0]
      };

      console.log('Initiating contract purchase:', contractParams);

      // Execute the contract purchase
      const result = await contractService.purchaseTicket(contractParams);
      
      console.log('Contract purchase successful:', result);
      
      toast({
        title: 'Transaction Successful',
        description: `Ticket purchased! Transaction: ${result.transactionHash.slice(0, 10)}...`,
      });

      return {
        ...result,
        contractAddress: accounts[0],
        chainId
      };
    } catch (error: any) {
      console.error('Contract purchase error:', error);
      
      toast({
        title: 'Transaction Failed',
        description: error.message || 'Failed to complete blockchain transaction',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    purchaseTicketWithContract,
    isProcessing
  };
};
