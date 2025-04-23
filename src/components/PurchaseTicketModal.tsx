import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMonadWallet } from '@/providers/MonadProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTickets } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ticket, Loader2, Coins } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

const NETWORK_FEE = 0.001;
const MONAD_TO_SOL_RATE = 2; // 1 SOL = 2 MONAD (example rate)

type CurrencyType = 'SOL' | 'MONAD';

interface PurchaseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  selectedTicketType: number;
  ticketQuantity: number;
}

const PurchaseTicketModal = ({
  isOpen,
  onClose,
  event,
  selectedTicketType,
  ticketQuantity,
}: PurchaseTicketModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('SOL');
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const { connected: monadConnected, publicKey: monadPublicKey } = useMonadWallet();
  const { user } = useAuth();
  const { purchaseTicketMutation } = useTickets();
  const navigate = useNavigate();

  const ticketType = event?.ticketTypes?.[selectedTicketType] || {
    name: 'General Admission',
    price: event?.price || 0.5
  };
  
  const basePrice = ticketType ? parseFloat(ticketType.price) * ticketQuantity : 0;
  const totalPriceInSol = basePrice + NETWORK_FEE;
  const totalPriceInMonad = totalPriceInSol * MONAD_TO_SOL_RATE;

  const isWalletConnected = (selectedCurrency === 'SOL' && solanaConnected) || 
                           (selectedCurrency === 'MONAD' && monadConnected);
  
  const walletPublicKey = selectedCurrency === 'SOL' ? solanaPublicKey : monadPublicKey;

  const handlePurchase = async () => {
    if (!user) {
      toast('Please sign in to purchase tickets');
      navigate('/auth');
      onClose();
      return;
    }

    if (!isWalletConnected || !walletPublicKey) {
      toast(`Please connect your ${selectedCurrency} wallet to purchase tickets`);
      onClose();
      return;
    }

    if (!ticketType) {
      toast('Invalid ticket type', { 
        description: 'Please select a valid ticket type',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create a small placeholder image buffer as fallback
      const fallbackBuffer = new ArrayBuffer(100);
      const view = new Uint8Array(fallbackBuffer);
      for (let i = 0; i < 100; i++) {
        view[i] = i % 256;
      }
      
      let imageBuffer: ArrayBuffer = fallbackBuffer;
      
      if (event.image_url) {
        try {
          console.log("Fetching image from:", event.image_url);
          const response = await fetch(event.image_url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer && buffer.byteLength > 0) {
              imageBuffer = buffer;
              console.log("Successfully loaded image buffer:", buffer.byteLength, "bytes");
            }
          }
        } catch (imageError) {
          console.error("Error loading image, using fallback:", imageError);
        }
      }
      
      await purchaseTicketMutation.mutateAsync({
        eventId: event.id,
        eventDetails: {
          ...event,
          title: event.title || 'Event',
          date: event.date || new Date().toISOString(),
          location: event.location || 'Virtual',
          ticketType: ticketType.name || 'General Admission',
          tickets_sold: event.tickets_sold || 0,
        },
        ticketType: ticketType.name || 'General Admission',
        price: selectedCurrency === 'SOL' ? totalPriceInSol : totalPriceInMonad,
        currency: selectedCurrency,
        imageBuffer
      });
      
      toast('Ticket purchased successfully!', {
        description: 'Your ticket has been added to your collection.'
      });
      
      onClose();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error in purchase process:', error);
      toast('Failed to purchase ticket', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value as CurrencyType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Ticket Purchase</DialogTitle>
          <DialogDescription>
            You're about to purchase {ticketQuantity} {ticketType?.name} ticket{ticketQuantity > 1 ? 's' : ''} for {event?.title}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket Type:</span>
              <span>{ticketType?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span>{ticketQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per Ticket:</span>
              <span>{ticketType?.price} {selectedCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Fee:</span>
              <span>{NETWORK_FEE} {selectedCurrency}</span>
            </div>
            
            <div className="pt-2 pb-3">
              <Select
                value={selectedCurrency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  <SelectItem value="MONAD">Monad (MONAD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Total:</span>
              <span>
                {selectedCurrency === 'SOL' ? totalPriceInSol : totalPriceInMonad.toFixed(3)} {selectedCurrency}
              </span>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This will mint an NFT ticket to your connected wallet. The NFT will serve as your proof of purchase and entry to the event.</p>
          </div>
          
          {!isWalletConnected && (
            <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 text-sm">
              Please connect your {selectedCurrency} wallet before proceeding with the purchase.
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            className={cn(
              "hover:opacity-90",
              selectedCurrency === 'SOL' ? 'bg-solana-gradient' : 'bg-purple-600'
            )}
            disabled={isProcessing || !isWalletConnected}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Pay with {selectedCurrency}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseTicketModal;
