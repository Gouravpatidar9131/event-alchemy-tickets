
import { useState } from 'react';
import { useTickets, Ticket } from '@/hooks/useTickets';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, XCircle, Search, Loader2, Camera, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';

interface CheckInScannerProps {
  eventId: string;
}

interface CheckInResult {
  success: boolean;
  message: string;
  ticketData?: Ticket;
}

interface RecentCheckIn {
  id: string;
  checked_in_at: string;
  metadata?: any;
}

const CheckInScanner = ({ eventId }: CheckInScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);

  const { checkInTicketMutation } = useTickets();
  const { useEventQuery } = useEvents();
  const { data: event } = useEventQuery(eventId);

  const handleQRScan = async (result: string) => {
    console.log('QR Code scanned:', result);
    try {
      // Parse the QR code data
      const qrData = JSON.parse(result);
      
      // Validate that this QR code is for the correct event
      if (qrData.eventId !== eventId) {
        setScanResult({
          success: false,
          message: 'This ticket is not for this event'
        });
        setIsScanning(false);
        return;
      }

      // Check in the ticket
      await checkInTicket(qrData.ticketId);
      setIsScanning(false);
    } catch (error) {
      console.error('Error parsing QR code:', error);
      setScanResult({
        success: false,
        message: 'Invalid QR code format'
      });
      setIsScanning(false);
    }
  };

  const handleQRError = (error: any) => {
    console.error('QR Scanner error:', error);
    toast('Error accessing camera. Please check permissions.');
    setIsScanning(false);
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const checkInTicket = async (ticketIdToCheck?: string) => {
    const targetTicketId = ticketIdToCheck || ticketId;
    
    if (!targetTicketId) {
      toast('Please enter a ticket ID or scan a QR code');
      return;
    }

    setIsProcessing(true);
    setScanResult(null);

    try {
      const checkedInTicket = await checkInTicketMutation.mutateAsync(targetTicketId);
      
      setScanResult({
        success: true,
        message: 'Ticket checked in successfully!',
        ticketData: checkedInTicket
      });

      // Add to recent check-ins
      setRecentCheckIns(prev => [
        {
          id: checkedInTicket.id,
          checked_in_at: new Date().toISOString(),
          metadata: checkedInTicket.metadata
        },
        ...prev.slice(0, 4) // Keep only last 5 check-ins
      ]);

      // Clear the ticket ID field
      setTicketId('');

      // Show success toast
      toast('✅ Ticket checked in successfully!');

    } catch (error: any) {
      console.error('Check-in error:', error);
      setScanResult({
        success: false,
        message: error.message || 'Failed to check in ticket'
      });
      toast('❌ ' + (error.message || 'Failed to check in ticket'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Ticket Check-In Scanner
          </CardTitle>
          <CardDescription>
            Scan QR codes or enter ticket IDs to check in attendees for {event?.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Scanner Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Start QR Scanner
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="outline" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Stop Scanner
                </Button>
              )}
            </div>

            {isScanning && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <QrScanner
                  onDecode={handleQRScan}
                  onError={handleQRError}
                  constraints={{
                    width: 300,
                    height: 300,
                    facingMode: 'environment'
                  }}
                />
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Enter ticket ID manually"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkInTicket()}
              />
              <Button 
                onClick={() => checkInTicket()} 
                disabled={isProcessing || !ticketId}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Check In
              </Button>
            </div>
          </div>

          {/* Result Display */}
          {scanResult && (
            <Card className={`border-2 ${scanResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {scanResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {scanResult.message}
                  </span>
                </div>
                {scanResult.ticketData && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Ticket ID: {scanResult.ticketData.id}</p>
                    {scanResult.ticketData.metadata?.attendeeName && (
                      <p>Attendee: {scanResult.ticketData.metadata.attendeeName}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCheckIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-mono text-sm">{checkIn.id}</span>
                    {checkIn.metadata?.attendeeName && (
                      <span className="text-sm text-gray-600">- {checkIn.metadata.attendeeName}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CheckInScanner;
