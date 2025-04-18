import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useEvents } from '@/hooks/useEvents';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PurchaseTicketModal from '@/components/PurchaseTicketModal';
import CheckInScanner from '@/components/CheckInScanner';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  User, 
  Ticket, 
  Info, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTicketType, setSelectedTicketType] = useState(0);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const { user } = useAuth();
  const { connected } = useWallet();
  const navigate = useNavigate();
  
  const { useEventQuery } = useEvents();
  const { data: event, isLoading, error } = useEventQuery(id || '');

  const handleBuyTicket = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!connected) {
      // Show a message to connect wallet first
      return;
    }
    
    setIsPurchaseModalOpen(true);
  };
  
  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-solana-purple" />
            <h2 className="text-xl font-medium">Loading event details...</h2>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCreator = user && event.creator_id === user.id;

  const ticketTypes = [
    {
      name: 'General Admission',
      price: event.price.toString(),
      available: event.total_tickets - event.tickets_sold,
      description: 'Access to all event activities and areas.'
    },
    {
      name: 'VIP Pass',
      price: (parseFloat(event.price) * 2).toString(),
      available: Math.max(10, Math.floor(event.total_tickets * 0.1) - Math.floor(event.tickets_sold * 0.1)),
      description: 'General admission benefits plus exclusive areas and perks.'
    }
  ];

  return (
    
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="relative h-64 md:h-96 bg-gradient-to-r from-solana-purple/70 to-solana-blue/70">
          <img 
            src={event.image_url} 
            alt={event.title} 
            className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3">
              <div className="glass-card rounded-xl p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Link to="/events" className="text-muted-foreground hover:text-foreground flex items-center mr-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Events
                  </Link>
                  <Badge variant="outline" className="bg-accent">Event</Badge>
                </div>
                
                <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                
                <div className="flex flex-wrap gap-y-4 mb-6">
                  <div className="flex items-center mr-6">
                    <Calendar className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center mr-6">
                    <Clock className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>{new Date(event.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex items-center mr-6">
                    <MapPin className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>Organized by Event Creator</span>
                  </div>
                </div>
                
                <Tabs defaultValue="details">
                  <TabsList className="glass-card">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="tickets">Tickets</TabsTrigger>
                    <TabsTrigger value="nft">NFT Features</TabsTrigger>
                    {isCreator && <TabsTrigger value="manage">Manage</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-6">
                    <h3 className="text-xl font-bold mb-4">About the Event</h3>
                    <p className="text-muted-foreground mb-6">{event.description}</p>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" className="mr-4 glass-button">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Event
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tickets" className="mt-6">
                    <h3 className="text-xl font-bold mb-4">Available Tickets</h3>
                    
                    <div className="space-y-4 mb-6">
                      {ticketTypes.map((ticketType, index) => (
                        <div 
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTicketType === index 
                              ? 'border-solana-purple bg-solana-purple/10' 
                              : 'border-border glass-card'
                          }`}
                          onClick={() => setSelectedTicketType(index)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold">{ticketType.name}</h4>
                              <p className="text-sm text-muted-foreground">{ticketType.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-solana-blue">{ticketType.price} SOL</p>
                              <p className="text-xs text-muted-foreground">{ticketType.available} remaining</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Ticket Quantity</h4>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                            disabled={ticketQuantity <= 1}
                          >
                            -
                          </Button>
                          <span className="mx-4">{ticketQuantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setTicketQuantity(Math.min(5, ticketQuantity + 1))}
                            disabled={ticketQuantity >= 5}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>{parseFloat(ticketTypes[selectedTicketType].price) * ticketQuantity} SOL</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                          <span>Transaction Fee</span>
                          <span>0.001 SOL</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-4">
                          <span>Total</span>
                          <span>{(parseFloat(ticketTypes[selectedTicketType].price) * ticketQuantity + 0.001).toFixed(3)} SOL</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-solana-gradient hover:opacity-90 text-white"
                      onClick={handleBuyTicket}
                      disabled={event.tickets_sold >= event.total_tickets}
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      {event.tickets_sold >= event.total_tickets 
                        ? 'Sold Out' 
                        : 'Buy NFT Ticket'}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="nft" className="mt-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-4">Dynamic NFT Ticket</h3>
                      <p className="text-muted-foreground">
                        Each ticket is a unique NFT that evolves throughout your event experience.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="glass-card p-4 rounded-lg text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-solana-purple/20 flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-solana-purple" />
                        </div>
                        <h4 className="font-bold mb-2">Pre-Event</h4>
                        <p className="text-sm text-muted-foreground">
                          Shows a countdown timer and unlocks exclusive pre-event content.
                        </p>
                      </div>
                      
                      <div className="glass-card p-4 rounded-lg text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-solana-blue/20 flex items-center justify-center mb-4">
                          <Ticket className="h-8 w-8 text-solana-blue" />
                        </div>
                        <h4 className="font-bold mb-2">During Event</h4>
                        <p className="text-sm text-muted-foreground">
                          Displays QR code for check-in and transforms after attendance verification.
                        </p>
                      </div>
                      
                      <div className="glass-card p-4 rounded-lg text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-solana-green/20 flex items-center justify-center mb-4">
                          <Info className="h-8 w-8 text-solana-green" />
                        </div>
                        <h4 className="font-bold mb-2">Post-Event</h4>
                        <p className="text-sm text-muted-foreground">
                          Becomes a collectible with special perks and access to exclusive content.
                        </p>
                      </div>
                    </div>
                    
                    <div className="glass-card p-6 rounded-lg">
                      <h4 className="font-bold mb-2">Loyalty Program</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Collect NFT tickets to earn VIP status and early access to future events.
                      </p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Your Current Level:</span>
                        <Badge variant="outline" className="bg-accent text-foreground">
                          New Attendee
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-1">
                        <div className="bg-solana-gradient h-2 rounded-full w-[10%]"></div>
                      </div>
                      <p className="text-xs text-muted-foreground text-right">1/10 events attended</p>
                    </div>
                  </TabsContent>
                  
                  {isCreator && (
                    <TabsContent value="manage" className="mt-6">
                      <h3 className="text-xl font-bold mb-4">Event Management</h3>
                      
                      <div className="space-y-6">
                        <div className="glass-card p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Event Status</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge className={event.is_published ? 'bg-green-500' : 'bg-amber-500'}>
                                {event.is_published ? 'Published' : 'Draft'}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.is_published 
                                  ? 'Your event is live and visible to the public' 
                                  : 'Your event is not yet visible to the public'}
                              </p>
                            </div>
                            {!event.is_published && (
                              <Button size="sm">Publish</Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="glass-card p-4 rounded-lg">
                          <h4 className="font-medium mb-3">Ticket Sales</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tickets Sold:</span>
                              <span className="font-medium">{event.tickets_sold} of {event.total_tickets}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-solana-gradient h-2 rounded-full" 
                                style={{ width: `${(event.tickets_sold / event.total_tickets) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                        
                        <CheckInScanner eventId={event.id.toString()} />
                        
                        <div className="flex justify-between">
                          <Button variant="outline">
                            Edit Event
                          </Button>
                          <Button variant="destructive">
                            Cancel Event
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
            
            <div className="w-full lg:w-1/3">
              <div className="sticky top-24">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-solana-purple/20 to-solana-blue/20 blur-lg animate-glow"></div>
                  <div className="relative glass-card rounded-2xl overflow-hidden ticket-shadow">
                    <div className="bg-solana-gradient h-2 w-full"></div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        <Badge>NFT Ticket</Badge>
                      </div>
                      
                      <img 
                        src={event.image_url} 
                        alt={event.title} 
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">{new Date(event.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">{new Date(event.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{event.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ticket Type:</span>
                          <span className="font-medium text-solana-purple">
                            {ticketTypes[selectedTicketType].name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-bold text-solana-blue">{ticketTypes[selectedTicketType].price} SOL</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Evolving NFT Asset</span>
                          <span>Powered by Solana</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      <PurchaseTicketModal
        isOpen={isPurchaseModalOpen}
        onClose={closePurchaseModal}
        event={{
          ...event,
          ticketTypes
        }}
        selectedTicketType={selectedTicketType}
        ticketQuantity={ticketQuantity}
      />
    </div>
  );
};

export default EventDetailPage;
