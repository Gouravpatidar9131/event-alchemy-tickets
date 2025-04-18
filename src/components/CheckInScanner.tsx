
import { useState, useEffect } from 'react';
import { useTickets } from '@/hooks/useTickets';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface CheckInScannerProps {
  eventId: string;
}

const CheckInScanner = ({ eventId }: CheckInScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { checkInTicketMutation } = useTickets();
  const { useEventQuery } = useEvents();
  
  const { data: event } = useEventQuery(eventId);
  
  // For a real app, this would integrate with a camera-based QR scanner
  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
    // Simulate scanning
    setTimeout(() => {
      setIsScanning(false);
      // This would normally get the ticket ID from a real QR scan
      // For demo purposes, just use the manual entry
    }, 2000);
  };
  
  const checkInTicket = async () => {
    if (!ticketId) {
      toast('Please enter a ticket ID');
      return;
    }
    
    setIsProcessing(true);
    setScanResult(null);
    
    try {
      await checkInTicketMutation.mutateAsync(ticketId);
      
      setScanResult({
        success: true,
        message: 'Ticket checked in successfully!'
      });
      
      // Clear the ticket ID field
      setTicketId('');
    } catch (error: any) {
      console.error('Check-in error:', error);
      
      setScanResult({
        success: false,
        message: error.message || 'Failed to check in ticket'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <CardTitle>Ticket Check-In</CardTitle>
        <CardDescription>
          Scan or enter ticket ID to check in attendees for {event?.title}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* QR Scanner (simulated) */}
          <div className="flex flex-col items-center justify-center">
            <div 
              className="w-64 h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center mb-4"
            >
              {isScanning ? (
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
              ) : scanResult ? (
                scanResult.success ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )
              ) : (
                <QrCode className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <Button 
              onClick={startScanning} 
              disabled={isScanning || isProcessing}
              className="mb-6"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code
                </>
              )}
            </Button>
          </div>
          
          {/* Manual Ticket ID Entry */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Or enter ticket ID manually:</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter ticket ID"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                disabled={isProcessing}
              />
              <Button 
                onClick={checkInTicket} 
                disabled={!ticketId || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Results */}
          {scanResult && (
            <div className={`p-4 rounded-md ${
              scanResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}>
              <p className="font-medium">{scanResult.message}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          {event?.tickets_sold || 0} of {event?.total_tickets || 0} tickets sold
        </p>
      </CardFooter>
    </Card>
  );
};

export default CheckInScanner;
