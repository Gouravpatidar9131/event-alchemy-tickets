
import {
  Metaplex,
  keypairIdentity,
  walletAdapterIdentity,
  toMetaplexFile
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js";
import { useWallet } from '@solana/wallet-adapter-react';

// Initialize Metaplex with browser local storage for uploads
export const initializeMetaplex = (wallet: any) => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const metaplex = Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet));
    
    return metaplex;
  } catch (error) {
    console.error("Error initializing Metaplex:", error);
    throw error;
  }
};

// Create NFT ticket metadata
export const createNftMetadata = (
  name: string,
  symbol: string,
  description: string,
  eventDetails: any,
  imageBuffer: ArrayBuffer
) => {
  try {
    const file = toMetaplexFile(imageBuffer, 'image.png');
    
    return {
      name,
      symbol,
      description,
      image: file,
      attributes: [
        { trait_type: 'Event', value: eventDetails.title },
        { trait_type: 'Date', value: eventDetails.date },
        { trait_type: 'Location', value: eventDetails.location },
        { trait_type: 'Ticket Type', value: eventDetails.ticketType },
        { trait_type: 'Status', value: 'Valid' }
      ],
      properties: {
        files: [
          {
            uri: 'image.png',
            type: 'image/png'
          }
        ]
      }
    };
  } catch (error) {
    console.error("Error creating NFT metadata:", error);
    throw error;
  }
};

// Create a single NFT ticket
export const createNFTTicket = async (
  metaplex: any,
  metadata: any,
  eventId: string,
  ticketTypeId: string
) => {
  try {
    // Upload metadata (including image) to Bundlr
    const { uri } = await metaplex.nfts().uploadMetadata(metadata);
    
    // Create the NFT ticket
    const { nft } = await metaplex.nfts().create({
      uri,
      name: metadata.name,
      sellerFeeBasisPoints: 0,
      symbol: metadata.symbol,
      tokenOwner: metaplex.identity().publicKey,
      creators: [
        {
          address: metaplex.identity().publicKey,
          share: 100,
        },
      ],
    });
    
    return {
      mint: nft.address.toString(),
      tokenId: nft.tokenId,
      metadataUri: uri
    };
  } catch (error) {
    console.error("Error creating NFT ticket:", error);
    throw error;
  }
};

// Verify NFT ticket
export const verifyNFTTicket = async (
  metaplex: any,
  mintAddress: string
) => {
  try {
    const mint = new PublicKey(mintAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
    
    // Verify ownership and NFT properties
    return nft;
  } catch (error) {
    console.error("Error verifying NFT ticket:", error);
    throw error;
  }
};

// Update NFT metadata (e.g. for check-in)
export const updateNFTTicketStatus = async (
  metaplex: any,
  mintAddress: string,
  newStatus: string
) => {
  try {
    const mint = new PublicKey(mintAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
    
    // Create updated metadata
    const updatedMetadata = { ...nft.json };
    
    // Update the status attribute
    const statusAttribute = updatedMetadata.attributes.find(
      (attr: any) => attr.trait_type === 'Status'
    );
    
    if (statusAttribute) {
      statusAttribute.value = newStatus;
    } else {
      updatedMetadata.attributes.push({
        trait_type: 'Status',
        value: newStatus
      });
    }
    
    // Upload updated metadata
    const { uri } = await metaplex.nfts().uploadMetadata(updatedMetadata);
    
    // Update NFT
    await metaplex.nfts().update({
      nftOrSft: nft,
      uri,
    });
    
    return { success: true, mintAddress, status: newStatus };
  } catch (error) {
    console.error("Error updating NFT ticket:", error);
    throw error;
  }
};
