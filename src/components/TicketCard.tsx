
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, QrCode, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

interface TicketCardProps {
  ticket: any;
  showDetails?: () => void;
}

const TicketCard = ({ ticket, showDetails }: TicketCardProps) => {
  const [showQR, setShowQR] = useState(false);
  
  const event = ticket.events;
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const getStatusColor = () => {
    switch (ticket.status) {
      case 'active':
        return 'bg-green-500 hover:bg-green-600';
      case 'used':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'transferred':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  const toggleQR = () => {
    setShowQR(!showQR);
  };
  
  const qrData = JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    status: ticket.status,
    mintAddress: ticket.mint_address || 'none'
  });

  return (
    <Card className="overflow-hidden glass-card border-none ticket-shadow">
      <div className={`h-2 w-full ${getStatusColor()}`}></div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold truncate">{event?.title || 'Unknown Event'}</h3>
          <Badge className={
            ticket.status === 'active' ? 'bg-green-500/20 text-green-500' :
            ticket.status === 'used' ? 'bg-gray-500/20 text-gray-500' :
            'bg-blue-500/20 text-blue-500'
          }>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Badge>
        </div>
        
        {event?.image_url && (
          <div className="relative mb-4 h-32 rounded-md overflow-hidden">
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
            {ticket.status === 'used' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg transform rotate-[-20deg] border-4 border-white px-3 py-1 rounded">
                  USED
                </span>
              </div>
            )}
          </div>
        )}
        
        {showQR ? (
          <div className="flex flex-col items-center justify-center space-y-3 my-4">
            <QRCodeSVG value={qrData} size={150} level="H" />
            <p className="text-sm text-center text-muted-foreground">
              Present this QR code at the event entrance
            </p>
            <Button variant="outline" size="sm" onClick={toggleQR}>
              Hide QR Code
            </Button>
          </div>
        ) : (
          <div className="space-y-3 my-4">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">{formatDate(event?.date || '')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                Purchased {formatDistanceToNow(new Date(ticket.purchase_date), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm truncate">{event?.location || 'Unknown location'}</span>
            </div>
          </div>
        )}
        
        <div className="border-t border-border pt-3 flex justify-between items-center">
          {ticket.status === 'active' && !showQR && (
            <Button variant="outline" size="sm" onClick={toggleQR}>
              <QrCode className="h-4 w-4 mr-1" />
              Show QR Code
            </Button>
          )}
          {ticket.status === 'used' && (
            <span className="text-sm text-muted-foreground">
              Used on {ticket.checked_in_at ? formatDate(ticket.checked_in_at) : 'unknown date'}
            </span>
          )}
          {ticket.status === 'transferred' && (
            <span className="text-sm text-muted-foreground">
              Transferred to another wallet
            </span>
          )}
          
          {showDetails && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="ml-auto text-solana-purple" 
              onClick={showDetails}
            >
              Details
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TicketCard;
