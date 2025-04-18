
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/providers/AuthProvider';
import { useTickets } from '@/hooks/useTickets';
import { useEvents } from '@/hooks/useEvents';
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
      // In a production app, this would involve a Solana transaction
      // For this demo, we're just simulating NFT creation
      
      // Create a mock image buffer for the ticket
      const response = await fetch(event.image_url);
      const imageBuffer = await response.arrayBuffer();
      
      // Purchase the ticket (mint NFT)
      await purchaseTicketMutation.mutateAsync({
        eventId: event.id,
        eventDetails: event,
        ticketType: ticketType.name,
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
