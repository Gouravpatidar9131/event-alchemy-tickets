
import { useState } from 'react';
import { useAccount } from 'wagmi';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Ticket, Loader2, Coins, CreditCard, Gift } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const NETWORK_FEE = 0.001;

interface PurchaseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  selectedTicketType: number;
  ticketQuantity: number;
}

type PaymentMethod = 'free' | 'stripe' | 'ethereum';

const PurchaseTicketModal = ({
  isOpen,
  onClose,
  event,
  selectedTicketType,
  ticketQuantity,
}: PurchaseTicketModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('free');
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const { purchaseTicketMutation } = useTickets();
  const navigate = useNavigate();

  const ticketType = event?.ticketTypes?.[selectedTicketType] || {
    name: 'General Admission',
    price: event?.price || 0
  };
  
  const basePrice = ticketType ? parseFloat(ticketType.price) * ticketQuantity : 0;
  const totalPriceInEth = basePrice + NETWORK_FEE;

  const handlePurchase = async () => {
    if (!user) {
      toast('Please sign in to purchase tickets');
      navigate('/auth');
      onClose();
      return;
    }

    if (paymentMethod === 'ethereum' && (!isConnected || !address)) {
      toast('Please connect your Ethereum wallet to purchase with ETH');
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
      // Create a small placeholder image buffer
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

      // Determine price and currency based on payment method
      let finalPrice = 0;
      let currency: 'ETH' | 'USD' | 'FREE' = 'FREE';
      
      if (paymentMethod === 'stripe') {
        finalPrice = basePrice * 10; // Convert to USD (multiply by 10 for demo)
        currency = 'USD';
      } else if (paymentMethod === 'ethereum') {
        finalPrice = totalPriceInEth;
        currency = 'ETH';
      } else {
        finalPrice = 0;
        currency = 'FREE';
      }

      console.log('Purchase details:', {
        paymentMethod,
        finalPrice,
        currency,
        ticketType: ticketType.name
      });
      
      await purchaseTicketMutation.mutateAsync({
        eventId: event.id,
        eventDetails: {
          title: event.title || 'Event',
          date: event.date || new Date().toISOString(),
          location: event.location || 'Virtual',
          ticketType: ticketType.name || 'General Admission',
          tickets_sold: event.tickets_sold || 0,
        },
        ticketType: ticketType.name || 'General Admission',
        price: finalPrice,
        currency: currency,
        imageBuffer,
        paymentMethod
      });
      
      const paymentMethodText = paymentMethod === 'free' ? 'for free' : 
                               paymentMethod === 'stripe' ? 'with Stripe' : 'with ETH';
      
      toast(`Ticket purchased successfully ${paymentMethodText}!`, {
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

  const getPaymentButtonText = () => {
    if (paymentMethod === 'free') return 'Get Free Ticket';
    if (paymentMethod === 'stripe') return 'Pay with Stripe';
    return 'Pay with ETH';
  };

  const getPaymentIcon = () => {
    if (paymentMethod === 'free') return <Gift className="h-4 w-4 mr-2" />;
    if (paymentMethod === 'stripe') return <CreditCard className="h-4 w-4 mr-2" />;
    return <Coins className="h-4 w-4 mr-2" />;
  };

  const getPaymentButtonColor = () => {
    if (paymentMethod === 'free') return 'bg-green-600 hover:bg-green-700';
    if (paymentMethod === 'stripe') return 'bg-purple-600 hover:bg-purple-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Ticket</DialogTitle>
          <DialogDescription>
            You're about to purchase {ticketQuantity} {ticketType?.name} ticket{ticketQuantity > 1 ? 's' : ''} for {event?.title}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket Type:</span>
              <span>{ticketType?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span>{ticketQuantity}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Payment Method:</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-2 text-green-600" />
                      <span>Free</span>
                    </div>
                    <span className="text-sm text-muted-foreground">$0.00</span>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
                      <span>Stripe (Credit Card)</span>
                    </div>
                    <span className="text-sm text-muted-foreground">${(basePrice * 10).toFixed(2)}</span>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="ethereum" id="ethereum" />
                <Label htmlFor="ethereum" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Ethereum</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{totalPriceInEth.toFixed(4)} ETH</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === 'ethereum' && (
            <div className="text-sm text-muted-foreground">
              <p>This will mint an NFT ticket to your connected Ethereum wallet. The NFT will serve as your proof of purchase and entry to the event.</p>
              {!isConnected && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 text-sm">
                  Please connect your Ethereum wallet before proceeding with ETH payment.
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'stripe' && (
            <div className="text-sm text-muted-foreground">
              <p>You will be redirected to Stripe's secure checkout to complete your payment.</p>
            </div>
          )}

          {paymentMethod === 'free' && (
            <div className="text-sm text-muted-foreground">
              <p>This ticket is completely free! You'll receive it instantly in your dashboard.</p>
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
            className={getPaymentButtonColor()}
            disabled={isProcessing || (paymentMethod === 'ethereum' && !isConnected)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {getPaymentIcon()}
                {getPaymentButtonText()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseTicketModal;
