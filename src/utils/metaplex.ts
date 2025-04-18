
import { PublicKey } from "@solana/web3.js";

// Mock NFT creation and management for development
export const initializeMetaplex = () => {
  console.log("Using mock Metaplex implementation");
  return createMockMetaplex();
};

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
            address: new PublicKey("11111111111111111111111111111111"),
            tokenId: `mock-token-${Date.now()}`,
            json: params
          }
        };
      },
      findByMint: async () => ({
        address: new PublicKey("11111111111111111111111111111111"),
        tokenId: `mock-token-${Date.now()}`,
        json: {
          name: "Mock NFT Ticket",
          description: "Development mock ticket",
          attributes: [{ trait_type: 'Status', value: 'Valid' }]
        }
      }),
      update: async (params: any) => ({
        success: true,
        nft: params.nftOrSft
      })
    }),
    identity: () => ({
      publicKey: new PublicKey("11111111111111111111111111111111")
    })
  };
};

export const createNftMetadata = (
  name: string,
  description: string,
  imageBuffer: ArrayBuffer
) => {
  return {
    name,
    description,
    image: new Uint8Array(imageBuffer),
    attributes: [
      { trait_type: 'Status', value: 'Valid' }
    ]
  };
};

export const createNFTTicket = async (
  metadata: any,
  eventId: string
) => {
  console.log("Creating mock NFT ticket:", { metadata, eventId });
  return {
    mint: `mock-mint-${Date.now()}`,
    tokenId: `mock-token-${Date.now()}`,
    metadataUri: `https://example.com/mock/${eventId}/${Date.now()}`
  };
};

export const verifyNFTTicket = async (mintAddress: string) => {
  return {
    address: mintAddress,
    tokenId: `mock-token-${Date.now()}`,
    json: {
      name: "Mock NFT Ticket",
      description: "Development mock ticket",
      attributes: [{ trait_type: 'Status', value: 'Valid' }]
    }
  };
};

export const updateNFTTicketStatus = async (
  mintAddress: string,
  newStatus: string
) => {
  return {
    success: true,
    mintAddress,
    status: newStatus
  };
};
