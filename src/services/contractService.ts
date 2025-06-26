
import { ethers } from 'ethers';

// Simple ticket contract ABI for basic ticket purchase
const TICKET_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "eventId", "type": "string"},
      {"internalType": "string", "name": "ticketType", "type": "string"},
      {"internalType": "uint256", "name": "quantity", "type": "uint256"}
    ],
    "name": "purchaseTicket",
    "outputs": [{"internalType": "uint256", "name": "ticketId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "ticketId", "type": "uint256"}],
    "name": "getTicket",
    "outputs": [
      {"internalType": "string", "name": "eventId", "type": "string"},
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "bool", "name": "used", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "eventId", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "ticketId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "TicketPurchased",
    "type": "event"
  }
];

// Contract addresses for different chains
const CONTRACT_ADDRESSES: Record<number, string> = {
  1: '0x1234567890123456789012345678901234567890', // Ethereum mainnet (placeholder)
  137: '0x1234567890123456789012345678901234567890', // Polygon (placeholder)
  42161: '0x1234567890123456789012345678901234567890', // Arbitrum (placeholder)
  10: '0x1234567890123456789012345678901234567890', // Optimism (placeholder)
  8453: '0x1234567890123456789012345678901234567890', // Base (placeholder)
  43114: '0x1234567890123456789012345678901234567890', // Avalanche (placeholder)
};

export interface ContractTicketPurchase {
  eventId: string;
  ticketType: string;
  quantity: number;
  priceInWei: string;
  buyerAddress: string;
}

export class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;

  async initialize(provider: any, chainId: number) {
    try {
      this.provider = new ethers.BrowserProvider(provider);
      this.signer = await this.provider.getSigner();
      
      const contractAddress = CONTRACT_ADDRESSES[chainId];
      if (!contractAddress) {
        throw new Error(`Contract not deployed on chain ${chainId}`);
      }
      
      this.contract = new ethers.Contract(
        contractAddress,
        TICKET_CONTRACT_ABI,
        this.signer
      );
      
      console.log('Contract service initialized:', {
        chainId,
        contractAddress,
        signer: await this.signer.getAddress()
      });
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      throw error;
    }
  }

  async purchaseTicket(params: ContractTicketPurchase): Promise<{
    transactionHash: string;
    ticketId: number;
    blockNumber?: number;
  }> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract service not initialized');
    }

    try {
      console.log('Purchasing ticket with contract:', params);
      
      // Call the contract's purchaseTicket function
      const tx = await this.contract.purchaseTicket(
        params.eventId,
        params.ticketType,
        params.quantity,
        {
          value: params.priceInWei
        }
      );

      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Parse the TicketPurchased event to get the ticket ID
      const ticketPurchasedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = this.contract!.interface.parseLog(log);
          return parsedLog?.name === 'TicketPurchased';
        } catch {
          return false;
        }
      });

      let ticketId = 0;
      if (ticketPurchasedEvent) {
        const parsedLog = this.contract.interface.parseLog(ticketPurchasedEvent);
        ticketId = Number(parsedLog?.args.ticketId || 0);
      }

      return {
        transactionHash: receipt.hash,
        ticketId,
        blockNumber: receipt.blockNumber
      };
    } catch (error: any) {
      console.error('Contract purchase failed:', error);
      
      // Handle specific error cases
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for transaction');
      } else if (error.code === 'USER_REJECTED') {
        throw new Error('Transaction rejected by user');
      } else if (error.message?.includes('execution reverted')) {
        throw new Error('Transaction failed: ' + (error.reason || 'Contract execution reverted'));
      }
      
      throw new Error(error.message || 'Transaction failed');
    }
  }

  async getTicketDetails(ticketId: number): Promise<{
    eventId: string;
    owner: string;
    used: boolean;
  }> {
    if (!this.contract) {
      throw new Error('Contract service not initialized');
    }

    try {
      const result = await this.contract.getTicket(ticketId);
      return {
        eventId: result[0],
        owner: result[1],
        used: result[2]
      };
    } catch (error) {
      console.error('Failed to get ticket details:', error);
      throw error;
    }
  }

  // Helper function to convert price to wei
  static priceToWei(priceInEth: number): string {
    return ethers.parseEther(priceInEth.toString()).toString();
  }

  // Helper function to convert wei to readable price
  static weiToEth(weiAmount: string): number {
    return parseFloat(ethers.formatEther(weiAmount));
  }
}

export const contractService = new ContractService();
