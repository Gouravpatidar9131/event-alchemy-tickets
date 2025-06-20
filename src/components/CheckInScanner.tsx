
import { useState } from 'react';
import { useTickets, Ticket } from '@/hooks/useTickets';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, XCircle, Search, Loader2, Camera, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { QrScanner } from '@yudiel/react-qr-scanner';

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

      // Play success sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIZLxOBzfLZiTUIGGW57uGVRw0YVKTX8LFsGzhB4M/zw3klBSaAzfLZijcJGWy987uCPAMwk+Hzx3IlBjF31fLBejEJJm7C8NuJOAMRWKnlr4hJEgVLnOL0vWYcBDGS2fO/eSMFJG/B8NiJOAkQUare7a9qGwpKn+L0wWUdBjOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wWUcBzOT2vN/dyUGI27A8NaKOQkPUKXf7K9rGwpJn+L0wW');
        audio.play().catch(() => {
          // Ignore audio play errors (e.g., no user interaction yet)
        });
      } catch (audioError) {
        // Ignore audio errors
      }

    } catch (error: any) {
      console.error('Error checking in ticket:', error);
      setScanResult({
        success: false,
        message: error.message || 'Failed to check in ticket'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Event Check-In Scanner
          </CardTitle>
          <CardDescription>
            {event ? `Checking in attendees for "${event.title}"` : 'Loading event...'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* QR Code Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="text-center">
              <Button onClick={startScanning} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start QR Code Scanner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <QrScanner
                  onDecode={handleQRScan}
                  onError={handleQRError}
                  containerStyle={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}
                />
              </div>
              <Button onClick={stopScanning} variant="outline" className="w-full">
                Stop Scanner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Manual Ticket Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter ticket ID..."
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={isProcessing}
            />
            <Button 
              onClick={() => checkInTicket()}
              disabled={isProcessing || !ticketId}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Check In'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {scanResult && (
        <Card>
          <CardContent className="pt-6">
            <div className={`flex items-center p-4 rounded-lg ${
              scanResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {scanResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-3" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  scanResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.message}
                </p>
                {scanResult.ticketData && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Ticket ID: {scanResult.ticketData.id}</p>
                    {scanResult.ticketData.metadata?.ticketType && (
                      <p>Type: {scanResult.ticketData.metadata.ticketType}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCheckIns.map((checkIn, index) => (
                <div 
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Ticket {checkIn.id.substring(0, 8)}...
                      </p>
                      {checkIn.metadata?.ticketType && (
                        <p className="text-xs text-gray-500">
                          {checkIn.metadata.ticketType}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {formatTime(checkIn.checked_in_at)}
                    </p>
                    <p className="text-xs text-green-600">Checked in</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Showing {recentCheckIns.length} recent check-ins
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CheckInScanner;
