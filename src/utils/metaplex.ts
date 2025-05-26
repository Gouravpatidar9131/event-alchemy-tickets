
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Initialize connection to Solana devnet
const connection = new Connection(clusterApiUrl('devnet'));

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export const createNFTMetadata = (
  eventTitle: string,
  eventDate: string,
  location: string,
  ticketType: string,
  imageUrl: string
): NFTMetadata => {
  return {
    name: `${eventTitle} - ${ticketType}`,
    description: `Ticket for ${eventTitle} on ${eventDate} at ${location}`,
    image: imageUrl,
    attributes: [
      {
        trait_type: 'Event',
        value: eventTitle
      },
      {
        trait_type: 'Date',
        value: eventDate
      },
      {
        trait_type: 'Location',
        value: location
      },
      {
        trait_type: 'Ticket Type',
        value: ticketType
      }
    ]
  };
};

export const uploadMetadata = async (metadata: NFTMetadata): Promise<string> => {
  // For now, return a placeholder metadata URI
  // In a real implementation, you would upload to IPFS or Arweave
  console.log('Metadata to upload:', metadata);
  return 'https://example.com/metadata.json';
};

export { connection };
