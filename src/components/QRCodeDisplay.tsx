
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, RefreshCw } from 'lucide-react';
import { useQRCodeGeneration } from '@/hooks/useQRCodeGeneration';
import { generateQRCodeImage, QRCodeData } from '@/utils/qrCodeGenerator';

interface QRCodeDisplayProps {
  ticketId: string;
  eventId: string;
  attendeeId: string;
  existingQRData?: QRCodeData;
  className?: string;
}

const QRCodeDisplay = ({ ticketId, eventId, attendeeId, existingQRData, className }: QRCodeDisplayProps) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateQRCodeMutation } = useQRCodeGeneration();

  useEffect(() => {
    if (existingQRData) {
      generateQRCodeImage(existingQRData)
        .then(setQrCodeImage)
        .catch(console.error);
    }
  }, [existingQRData]);

  const handleGenerateQRCode = async () => {
    setIsGenerating(true);
    try {
      const result = await generateQRCodeMutation.mutateAsync({
        ticketId,
        eventId,
        attendeeId,
      });
      setQrCodeImage(result.qrCodeImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `ticket-${ticketId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Ticket QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCodeImage ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <img 
                src={qrCodeImage} 
                alt="Ticket QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateQRCode}
                disabled={isGenerating}
                variant="outline"
                size="sm"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
              <Button
                onClick={handleDownloadQRCode}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <QrCode className="h-12 w-12 text-gray-400" />
            </div>
            <Button
              onClick={handleGenerateQRCode}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Generate QR Code
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground text-center">
          Show this QR code at the event entrance for quick check-in
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
