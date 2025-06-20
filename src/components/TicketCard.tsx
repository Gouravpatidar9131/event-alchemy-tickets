
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, QrCode, User } from 'lucide-react';
import { format } from 'date-fns';
import { Ticket } from '@/hooks/useTickets';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QRCodeDisplay from './QRCodeDisplay';

interface TicketCardProps {
  ticket: Ticket;
}

const TicketCard = ({ ticket }: TicketCardProps) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'used':
        return 'Checked In';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Active';
    }
  };

  const event = ticket.events;
  if (!event) return null;

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusText(ticket.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(event.date), 'h:mm a')}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.metadata?.attendeeName || 'Anonymous'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">
                {ticket.metadata?.currency} {ticket.purchase_price}
              </span>
            </div>
          </div>
          
          {ticket.checked_in_at && (
            <div className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
              <strong>Checked in:</strong> {format(new Date(ticket.checked_in_at), 'MMM d, yyyy h:mm a')}
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={ticket.status === 'cancelled'}
                >
                  <QrCode className="h-4 w-4" />
                  {ticket.qr_code_data ? 'View QR Code' : 'Generate QR Code'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ticket QR Code</DialogTitle>
                </DialogHeader>
                <QRCodeDisplay
                  ticketId={ticket.id}
                  eventId={ticket.event_id}
                  attendeeId={ticket.owner_id}
                  existingQRData={ticket.qr_code_data}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TicketCard;
