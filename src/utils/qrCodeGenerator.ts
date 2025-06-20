
import QRCode from 'qrcode';

export interface QRCodeData {
  ticketId: string;
  eventId: string;
  attendeeId: string;
  attendeeName?: string;
  timestamp: string;
  signature: string;
}

export const generateQRCodeData = (ticketId: string, eventId: string, attendeeId: string, attendeeName?: string): QRCodeData => {
  const timestamp = new Date().toISOString();
  // Create a simple signature to prevent tampering
  const signature = btoa(`${ticketId}-${eventId}-${attendeeId}-${timestamp}`);
  
  return {
    ticketId,
    eventId,
    attendeeId,
    attendeeName,
    timestamp,
    signature
  };
};

export const generateQRCodeImage = async (qrData: QRCodeData): Promise<string> => {
  try {
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const validateQRCodeData = (qrData: QRCodeData): boolean => {
  try {
    const expectedSignature = btoa(`${qrData.ticketId}-${qrData.eventId}-${qrData.attendeeId}-${qrData.timestamp}`);
    return qrData.signature === expectedSignature;
  } catch (error) {
    console.error('Error validating QR code:', error);
    return false;
  }
};
