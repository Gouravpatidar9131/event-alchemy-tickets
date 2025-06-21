
import { supabase } from '@/integrations/supabase/client';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  external_url?: string;
}

export interface MintResult {
  success: boolean;
  mintAddress?: string;
  metadataUri?: string;
  transactionHash?: string;
  error?: string;
}

export class NFTMintingService {
  private static instance: NFTMintingService;

  static getInstance(): NFTMintingService {
    if (!NFTMintingService.instance) {
      NFTMintingService.instance = new NFTMintingService();
    }
    return NFTMintingService.instance;
  }

  async generateNFTMetadata(
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
    attendeeName: string,
    checkInTime: string,
    checkInLocation: string,
    eventImageUrl?: string
  ): Promise<NFTMetadata> {
    const eventDateObj = new Date(eventDate);
    const checkInTimeObj = new Date(checkInTime);

    // Generate unique traits based on check-in timing
    const isEarlyBird = checkInTimeObj.getTime() < eventDateObj.getTime() - (2 * 60 * 60 * 1000); // 2 hours early
    const checkInHour = checkInTimeObj.getHours();
    const timeOfDay = checkInHour < 12 ? 'Morning' : checkInHour < 18 ? 'Afternoon' : 'Evening';

    return {
      name: `${eventTitle} - Attendance NFT`,
      description: `This NFT certifies attendance at ${eventTitle} on ${eventDateObj.toLocaleDateString()}. Checked in at ${checkInLocation} on ${checkInTimeObj.toLocaleString()}.`,
      image: eventImageUrl || 'https://via.placeholder.com/400x400?text=Event+NFT',
      attributes: [
        {
          trait_type: 'Event',
          value: eventTitle
        },
        {
          trait_type: 'Date',
          value: eventDateObj.toLocaleDateString()
        },
        {
          trait_type: 'Location',
          value: eventLocation
        },
        {
          trait_type: 'Check-in Location',
          value: checkInLocation
        },
        {
          trait_type: 'Check-in Time',
          value: timeOfDay
        },
        {
          trait_type: 'Attendee Type',
          value: isEarlyBird ? 'Early Bird' : 'Regular'
        },
        {
          trait_type: 'Attendee',
          value: attendeeName
        }
      ],
      external_url: `${window.location.origin}/events`
    };
  }

  async uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
    try {
      // Using a public IPFS gateway for demo purposes
      // In production, you'd use a dedicated IPFS service like Pinata or Web3.Storage
      const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
        method: 'POST',
        body: JSON.stringify(metadata),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback: create a data URI for metadata
        const metadataString = JSON.stringify(metadata);
        return `data:application/json;base64,${btoa(metadataString)}`;
      }

      const result = await response.json();
      return `https://ipfs.io/ipfs/${result.Hash}`;
    } catch (error) {
      console.error('IPFS upload failed, using fallback:', error);
      // Fallback: create a data URI for metadata
      const metadataString = JSON.stringify(metadata);
      return `data:application/json;base64,${btoa(metadataString)}`;
    }
  }

  async mintNFTForAttendance(attendanceId: string): Promise<MintResult> {
    try {
      console.log('Starting NFT minting process for attendance:', attendanceId);

      // Get attendance record with event and attendee details
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          events (
            title,
            date,
            location,
            image_url,
            nft_enabled,
            nft_artwork_url,
            nft_collection_name,
            nft_description_template
          ),
          profiles!attendance_attendee_id_fkey (
            display_name
          )
        `)
        .eq('id', attendanceId)
        .single();

      if (attendanceError || !attendance) {
        throw new Error('Attendance record not found');
      }

      // Check if NFT is enabled for this event
      if (!attendance.events?.nft_enabled) {
        throw new Error('NFT minting is not enabled for this event');
      }

      // Check if NFT already minted
      if (attendance.nft_status === 'minted' && attendance.nft_mint_address) {
        return {
          success: true,
          mintAddress: attendance.nft_mint_address,
          metadataUri: attendance.nft_metadata_uri,
        };
      }

      // Generate NFT metadata
      const metadata = await this.generateNFTMetadata(
        attendance.events.title,
        attendance.events.date,
        attendance.events.location,
        attendance.profiles?.display_name || 'Anonymous Attendee',
        attendance.checked_in_at,
        attendance.check_in_location || 'Main Entrance',
        attendance.events.nft_artwork_url || attendance.events.image_url
      );

      // Upload metadata to IPFS
      const metadataUri = await this.uploadMetadataToIPFS(metadata);

      // Call edge function to mint NFT
      const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-nft', {
        body: {
          attendanceId,
          metadataUri,
          metadata,
          attendeeId: attendance.attendee_id,
          eventId: attendance.event_id
        }
      });

      if (mintError) {
        throw new Error(mintError.message);
      }

      // Update attendance record with NFT info
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          nft_mint_address: mintResult.mintAddress,
          nft_metadata_uri: metadataUri,
          nft_minted_at: new Date().toISOString(),
          nft_status: 'minted'
        })
        .eq('id', attendanceId);

      if (updateError) {
        console.error('Failed to update attendance record:', updateError);
      }

      console.log('NFT minted successfully:', mintResult);
      return {
        success: true,
        mintAddress: mintResult.mintAddress,
        metadataUri,
        transactionHash: mintResult.transactionHash
      };

    } catch (error: any) {
      console.error('NFT minting failed:', error);
      
      // Update status to failed
      await supabase
        .from('attendance')
        .update({ nft_status: 'failed' })
        .eq('id', attendanceId);

      return {
        success: false,
        error: error.message
      };
    }
  }

  getOpenSeaURL(mintAddress: string, chain: 'ethereum' | 'polygon' | 'solana' = 'ethereum'): string {
    switch (chain) {
      case 'ethereum':
        return `https://opensea.io/assets/ethereum/${mintAddress}`;
      case 'polygon':
        return `https://opensea.io/assets/matic/${mintAddress}`;
      case 'solana':
        return `https://opensea.io/assets/solana/${mintAddress}`;
      default:
        return `https://opensea.io/assets/${mintAddress}`;
    }
  }
}

export const nftMintingService = NFTMintingService.getInstance();
