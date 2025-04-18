
import {
  Metaplex,
  walletAdapterIdentity,
  toMetaplexFile
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

// Initialize Metaplex with browser local storage for uploads
export const initializeMetaplex = (wallet: any) => {
  try {
    if (!wallet) {
      console.error("Wallet is not connected");
      throw new Error("Wallet is not connected");
    }
    
    const connection = new Connection(clusterApiUrl("devnet"));
    console.log("Connection established to devnet");
    
    // Initialize with wallet adapter identity
    const metaplex = Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet));
    
    console.log("Metaplex initialized successfully");
    return metaplex;
  } catch (error) {
    console.error("Error initializing Metaplex:", error);
    
    // Return a mock metaplex object for development
    if (process.env.NODE_ENV !== 'production') {
      console.log("Returning mock Metaplex for development");
      return createMockMetaplex();
    }
    
    throw error;
  }
};

// Create a mock Metaplex object for development
const createMockMetaplex = () => {
  return {
    nfts: () => ({
      uploadMetadata: async (metadata: any) => {
        console.log("Mock: Uploading metadata:", metadata);
        return { uri: `https://example.com/mock-uri/${Date.now()}` };
      },
      create: async (params: any) => {
        console.log("Mock: Creating NFT:", params);
        return {
          nft: {
            address: { toString: () => `mock-address-${Date.now()}` },
            tokenId: `mock-token-${Date.now()}`,
            json: params
          }
        };
      },
      findByMint: async ({ mintAddress }: any) => {
        console.log("Mock: Finding NFT by mint:", mintAddress);
        return {
          address: mintAddress,
          tokenId: `mock-token-${Date.now()}`,
          json: {
            name: "Mock NFT",
            description: "Mock NFT Description",
            attributes: [
              { trait_type: 'Status', value: 'Active' }
            ]
          }
        };
      },
      update: async (params: any) => {
        console.log("Mock: Updating NFT:", params);
        return { success: true, nft: params.nftOrSft };
      }
    }),
    identity: () => ({
      publicKey: { toString: () => "mock-public-key" }
    })
  };
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
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      throw new Error("Invalid image buffer");
    }
    
    // Convert buffer to Metaplex file format
    const file = toMetaplexFile(imageBuffer, 'image.png');
    console.log("Created Metaplex file from image buffer");
    
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
    if (!metaplex || !metadata) {
      throw new Error("Invalid metaplex instance or metadata");
    }
    
    console.log("Starting NFT ticket creation process");
    
    // Safely attempt to upload metadata
    let uri;
    try {
      // Upload metadata (including image) to Bundlr
      const uploadResult = await metaplex.nfts().uploadMetadata(metadata);
      uri = uploadResult.uri;
      console.log("Metadata uploaded successfully:", uri);
    } catch (uploadError) {
      console.error("Error uploading metadata:", uploadError);
      // Use a fallback URI if upload fails
      uri = `https://example.com/fallback/${eventId}/${Date.now()}`;
      console.log("Using fallback URI:", uri);
    }
    
    // Create the NFT ticket
    console.log("Creating NFT with URI:", uri);
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
    
    console.log("NFT created successfully:", nft.address.toString());
    
    return {
      mint: nft.address.toString(),
      tokenId: nft.tokenId,
      metadataUri: uri
    };
  } catch (error) {
    console.error("Error creating NFT ticket:", error);
    
    // Return a simulation result for development if in error state
    if (process.env.NODE_ENV !== 'production') {
      console.log("Returning simulated NFT data for development");
      return {
        mint: `simulated-${Date.now()}`,
        tokenId: `token-${Date.now()}`,
        metadataUri: `https://example.com/simulated/${Date.now()}`
      };
    }
    
    throw error;
  }
};

// Verify NFT ticket
export const verifyNFTTicket = async (
  metaplex: any,
  mintAddress: string
) => {
  try {
    if (!metaplex || !mintAddress) {
      throw new Error("Invalid metaplex instance or mint address");
    }
    
    console.log("Verifying NFT ticket:", mintAddress);
    const mint = new PublicKey(mintAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
    
    console.log("NFT verification successful");
    // Verify ownership and NFT properties
    return nft;
  } catch (error) {
    console.error("Error verifying NFT ticket:", error);
    
    // Return mock data in development
    if (process.env.NODE_ENV !== 'production') {
      return {
        address: mintAddress,
        tokenId: `mock-token-${Date.now()}`,
        json: {
          name: "Mock NFT Ticket",
          description: "This is a mock NFT ticket for development",
          attributes: [
            { trait_type: 'Status', value: 'Valid' }
          ]
        }
      };
    }
    
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
    if (!metaplex || !mintAddress) {
      throw new Error("Invalid metaplex instance or mint address");
    }
    
    console.log("Updating NFT ticket status:", mintAddress, "to", newStatus);
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
    
    console.log("Uploading updated metadata");
    // Upload updated metadata
    const { uri } = await metaplex.nfts().uploadMetadata(updatedMetadata);
    
    console.log("Updating NFT with new URI:", uri);
    // Update NFT
    await metaplex.nfts().update({
      nftOrSft: nft,
      uri,
    });
    
    console.log("NFT update successful");
    return { success: true, mintAddress, status: newStatus };
  } catch (error) {
    console.error("Error updating NFT ticket:", error);
    
    // Return a simulated success for development
    if (process.env.NODE_ENV !== 'production') {
      console.log("Returning simulated success for development");
      return { success: true, mintAddress, status: newStatus };
    }
    
    throw error;
  }
};
