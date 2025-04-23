
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket, Users, Image } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import PurchaseTicketModal from '@/components/PurchaseTicketModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTickets } from '@/hooks/useTickets';
import CheckInScanner from '@/components/CheckInScanner';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { useEventQuery } = useEvents();
  const { user } = useAuth();
  const { connected } = useWallet();
  const { useEventTicketsQuery } = useTickets();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(0);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { data: event, isLoading, error } = useEventQuery(id || '');
  const { data: eventTickets } = useEventTicketsQuery(id || '');
  
  const isCreator = user && event && user.id === event.creator_id;
  const availableTickets = event ? event.total_tickets - event.tickets_sold : 0;
  const eventDate = event ? new Date(event.date) : new Date();
  
  // Define ticket types based on event price
  const ticketTypes = [
    { name: 'General Admission', price: event?.price?.toString() || '0' },
    { name: 'VIP', price: (event?.price ? event.price * 2 : 0).toString() },
    { name: 'Premium', price: (event?.price ? event.price * 3 : 0).toString() }
  ];
  
  // Add ticket types to event object
  const eventWithTicketTypes = event ? {
    ...event,
    ticketTypes
  } : null;
  
  useEffect(() => {
    if (error) {
      console.error('Error loading event:', error);
    }
    
    // Reset image states when event changes
    if (event) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [error, event]);

  const handlePurchase = (ticketTypeIndex: number) => {
    setSelectedTicketType(ticketTypeIndex);
    setIsModalOpen(true);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  const handleImageError = () => {
    console.error('Error loading image from URL:', event?.image_url);
    setImageError(true);
    setImageLoaded(false);
  };
  
  // Get a placeholder image if no image or error loading
  const getPlaceholderImage = () => {
    const placeholders = [
      "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      "https://images.unsplash.com/photo-1518770660439-4636190af475",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
    ];
    
    // Use event ID as a seed to always get the same placeholder for the same event
    const seed = id ? parseInt(id.substring(0, 8), 16) : 0;
    const index = seed % placeholders.length;
    return `${placeholders[index]}?w=800&h=450&fit=crop&auto=format`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <p>The event you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          
          <div className="rounded-lg overflow-hidden mb-6 aspect-video bg-muted relative">
            {!imageError && event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : null}
            
            {/* Show placeholder while loading or if error/no image */}
            {(!imageLoaded || imageError || !event.image_url) && (
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={getPlaceholderImage()} 
                  alt={`${event.title} placeholder`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to a colored background if even the placeholder fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Final fallback if all images fail */}
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 ${(imageLoaded && !imageError) ? 'hidden' : ''}`}>
              <Image className="h-16 w-16 text-white opacity-50" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {format(eventDate, 'EEEE, MMMM d, yyyy • h:mm a')}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {event.location}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              {event.tickets_sold} / {event.total_tickets} tickets sold
            </div>
          </div>
          
          <Tabs defaultValue="details" className="mb-8">
            <TabsList>
              <TabsTrigger value="details">Event Details</TabsTrigger>
              {isCreator && <TabsTrigger value="manage">Manage Event</TabsTrigger>}
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <div className="prose max-w-none dark:prose-invert">
                <p className="whitespace-pre-line">{event.description}</p>
              </div>
            </TabsContent>
            {isCreator && (
              <TabsContent value="manage" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Attendees</h3>
                    {eventTickets && eventTickets.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          {eventTickets.length} ticket(s) sold
                        </p>
                        <div className="border rounded-md">
                          <table className="min-w-full divide-y divide-border">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {eventTickets.map((ticket) => (
                                <tr key={ticket.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {ticket.profiles?.display_name || 'Anonymous'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {format(new Date(ticket.purchase_date), 'MMM d, yyyy')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      ticket.status === 'used' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }`}>
                                      {ticket.status === 'used' ? 'Checked In' : 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p>No tickets sold yet.</p>
                    )}
                    
                    <Separator className="my-6" />
                    
                    <h3 className="text-xl font-semibold mb-4">Check-In Attendees</h3>
                    <CheckInScanner eventId={id || ''} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Get Tickets</h2>
              
              {availableTickets > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {availableTickets} tickets available
                  </p>
                  
                  <div className="space-y-4">
                    {ticketTypes.map((type, index) => (
                      <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{type.name}</h3>
                          <p className="text-sm text-muted-foreground">{type.price} SOL</p>
                        </div>
                        <Button 
                          onClick={() => handlePurchase(index)}
                          disabled={!connected}
                          className="bg-solana-gradient hover:opacity-90"
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Buy
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {!connected && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Please connect your wallet to purchase tickets
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="font-semibold text-lg">Sold Out</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All tickets for this event have been sold
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {eventWithTicketTypes && (
        <PurchaseTicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={eventWithTicketTypes}
          selectedTicketType={selectedTicketType}
          ticketQuantity={ticketQuantity}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
