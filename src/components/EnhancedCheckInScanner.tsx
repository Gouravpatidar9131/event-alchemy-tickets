import { useState, useEffect } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, XCircle, Search, Loader2, Camera, User, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { QRCodeData, validateQRCodeData } from '@/utils/qrCodeGenerator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import NFTAttendanceBadge from './NFTAttendanceBadge';

interface EnhancedCheckInScannerProps {
  eventId: string;
}

interface CheckInResult {
  success: boolean;
  message: string;
  attendanceData?: any;
}

const EnhancedCheckInScanner = ({ eventId }: EnhancedCheckInScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInLocation, setCheckInLocation] = useState('');

  const { checkInMutation, useEventAttendanceQuery } = useAttendance();
  const { useEventQuery } = useEvents();
  const { data: event } = useEventQuery(eventId);
  const { data: attendance, refetch: refetchAttendance } = useEventAttendanceQuery(eventId);

  // Real-time attendance updates
  useEffect(() => {
    const channel = supabase
      .channel(`attendance-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Real-time attendance update:', payload);
          refetchAttendance();
          toast('✅ New attendee checked in!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Real-time attendance NFT update:', payload);
          refetchAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, refetchAttendance]);

  const handleQRScan = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      console.log('QR Code scanned:', result);
      await processQRCode(result);
      setIsScanning(false);
    }
  };

  const handleQRError = (error: any) => {
    console.error('QR Scanner error:', error);
    toast('Error accessing camera. Please check permissions.');
    setIsScanning(false);
  };

  const processQRCode = async (qrString: string) => {
    setIsProcessing(true);
    setScanResult(null);

    try {
      // Parse QR code data
      const qrData: QRCodeData = JSON.parse(qrString);
      
      // Validate QR code structure
      if (!qrData.ticketId || !qrData.eventId || !qrData.attendeeId) {
        throw new Error('Invalid QR code format - missing required data');
      }

      // Validate that this QR code is for the correct event
      if (qrData.eventId !== eventId) {
        setScanResult({
          success: false,
          message: 'This QR code is not for this event'
        });
        return;
      }

      // Validate QR code integrity
      if (!validateQRCodeData(qrData)) {
        setScanResult({
          success: false,
          message: 'Invalid QR code - data may have been tampered with'
        });
        return;
      }

      // Process check-in
      const attendanceRecord = await checkInMutation.mutateAsync({
        qrData,
        location: checkInLocation || 'Main Entrance'
      });

      setScanResult({
        success: true,
        message: 'Successfully checked in!',
        attendanceData: attendanceRecord
      });

      // Clear manual input
      setManualInput('');

    } catch (error: any) {
      console.error('QR code processing error:', error);
      setScanResult({
        success: false,
        message: error.message || 'Failed to process QR code'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualInput.trim()) {
      toast('Please enter QR code data or ticket ID');
      return;
    }

    await processQRCode(manualInput);
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const getTotalCheckedIn = () => {
    return attendance?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Event Check-In Scanner
          </CardTitle>
          <CardDescription>
            Scanning for: {event?.title}
            {event?.nft_enabled && (
              <Badge variant="secondary" className="ml-2">
                NFT Enabled
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {getTotalCheckedIn()} checked in
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Check-in Location (Optional)
            </label>
            <Input
              placeholder="e.g., Main Entrance, VIP Gate"
              value={checkInLocation}
              onChange={(e) => setCheckInLocation(e.target.value)}
            />
          </div>

          {/* Scanner Section */}
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
                  onScan={handleQRScan}
                  onError={handleQRError}
                  styles={{
                    container: {
                      width: '100%',
                      maxWidth: '400px',
                      height: '300px',
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Manual Entry</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Paste QR code data or enter ticket ID"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
              />
              <Button 
                onClick={handleManualCheckIn} 
                disabled={isProcessing || !manualInput.trim()}
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
                {scanResult.attendanceData && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-gray-600">
                      <p>Checked in at: {new Date(scanResult.attendanceData.checked_in_at).toLocaleString()}</p>
                      {scanResult.attendanceData.check_in_location && (
                        <p>Location: {scanResult.attendanceData.check_in_location}</p>
                      )}
                    </div>
                    {event?.nft_enabled && (
                      <NFTAttendanceBadge 
                        attendance={scanResult.attendanceData} 
                        eventNftEnabled={event?.nft_enabled}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      {attendance && attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Check-ins ({attendance.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendance.slice(0, 10).map((record) => (
                <div key={record.id} className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-mono text-sm">{record.ticket_id.slice(0, 8)}...</span>
                      {record.check_in_location && (
                        <Badge variant="secondary" className="text-xs">
                          {record.check_in_location}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(record.checked_in_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {event?.nft_enabled && (
                    <NFTAttendanceBadge 
                      attendance={record} 
                      eventNftEnabled={event?.nft_enabled}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCheckInScanner;
