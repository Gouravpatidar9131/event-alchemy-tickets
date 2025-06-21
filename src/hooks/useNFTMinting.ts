
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { nftMintingService, MintResult } from '@/services/NFTMintingService';

export const useNFTMinting = () => {
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();

  const mintNFT = async (attendanceId: string): Promise<MintResult> => {
    setIsMinting(true);
    
    try {
      const result = await nftMintingService.mintNFTForAttendance(attendanceId);
      
      if (result.success) {
        toast({
          title: 'NFT Minted Successfully! 🎉',
          description: 'Your attendance NFT has been minted and is ready to view on OpenSea.',
        });
      } else {
        toast({
          title: 'NFT Minting Failed',
          description: result.error || 'Failed to mint NFT. Please try again.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error: any) {
      const result = {
        success: false,
        error: error.message
      };
      
      toast({
        title: 'NFT Minting Error',
        description: error.message,
        variant: 'destructive',
      });
      
      return result;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    mintNFT,
    isMinting
  };
};
