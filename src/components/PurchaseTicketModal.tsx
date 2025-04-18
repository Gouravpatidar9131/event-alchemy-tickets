
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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
import { Ticket, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

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
  const { connected, publicKey } = useWallet();
  const { user } = useAuth();
  const { purchaseTicketMutation } = useTickets();
  const navigate = useNavigate();

  const ticketType = event?.ticketTypes?.[selectedTicketType];
  const totalPrice = ticketType ? parseFloat(ticketType.price) * ticketQuantity : 0;

  const handlePurchase = async () => {
    if (!user) {
      toast('Please sign in to purchase tickets');
      navigate('/auth');
      onClose();
      return;
    }

    if (!connected || !publicKey) {
      toast('Please connect your wallet to purchase tickets');
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
      // Create a mock image buffer for the ticket
      let imageBuffer: ArrayBuffer;
      try {
        // Ensure the image URL is valid and accessible
        const imageUrl = event.image_url || 'https://via.placeholder.com/500';
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        imageBuffer = await response.arrayBuffer();
        
        // Verify we have valid data
        if (!imageBuffer || imageBuffer.byteLength === 0) {
          throw new Error("Empty image data");
        }
      } catch (imageError) {
        console.error("Error loading image, using fallback:", imageError);
        // Create a simple fallback buffer if the image fetch fails
        imageBuffer = new ArrayBuffer(100);
        const view = new Uint8Array(imageBuffer);
        for (let i = 0; i < 100; i++) {
          view[i] = i % 256;
        }
      }
      
      // Purchase the ticket (mint NFT)
      await purchaseTicketMutation.mutateAsync({
        eventId: event.id,
        eventDetails: {
          ...event,
          title: event.title || 'Event',
          date: event.date || new Date().toISOString(),
          location: event.location || 'Virtual',
        },
        ticketType: ticketType.name || 'General Admission',
        price: totalPrice,
        imageBuffer
      });
      
      onClose();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      toast('Failed to purchase ticket', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
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
              <span>{ticketType?.price} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Fee:</span>
              <span>0.001 SOL</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Total:</span>
              <span>{(totalPrice + 0.001).toFixed(3)} SOL</span>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This will mint an NFT ticket to your connected wallet. The NFT will serve as your proof of purchase and entry to the event.</p>
          </div>
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
            className="bg-solana-gradient hover:opacity-90"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                Buy NFT Ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseTicketModal;
