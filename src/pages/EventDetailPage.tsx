
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  User, 
  Ticket, 
  Info, 
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

// Mock event data
const events = {
  '1': {
    id: '1',
    title: 'Solana Summer Hackathon',
    date: 'June 10, 2025',
    time: '9:00 AM - 6:00 PM',
    location: 'Virtual Event',
    imageUrl: 'https://images.unsplash.com/photo-1591522811280-a8759970b03f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '0.5 SOL',
    category: 'Technology',
    availability: 'available' as const,
    organizer: 'Solana Foundation',
    description: 'Join the most exciting hackathon in the Solana ecosystem! Developers will come together to build innovative applications on Solana. Prizes include SOL tokens and grants for the best projects.',
    ticketTypes: [
      {
        name: 'General Admission',
        price: '0.5 SOL',
        available: 150,
        description: 'Access to all hackathon activities and workshops.'
      },
      {
        name: 'VIP Pass',
        price: '1.2 SOL',
        available: 50,
        description: 'General admission benefits plus exclusive mentorship sessions and private networking events.'
      }
    ]
  },
  '2': {
    id: '2',
    title: 'Metaverse Music Festival',
    date: 'July 5, 2025',
    time: '8:00 PM - 2:00 AM',
    location: 'Decentraland',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '1.2 SOL',
    category: 'Music',
    availability: 'limited' as const,
    organizer: 'Virtual Worlds Collective',
    description: 'Experience the future of concerts in the metaverse! This groundbreaking music festival brings together top artists in a virtual environment where fans can interact, dance, and enjoy performances in ways never before possible.',
    ticketTypes: [
      {
        name: 'Standard Access',
        price: '1.2 SOL',
        available: 75,
        description: 'Access to all main stage performances and common areas.'
      },
      {
        name: 'Premium Experience',
        price: '2.5 SOL',
        available: 30,
        description: 'Standard access plus backstage passes and exclusive artist meet & greets in the virtual world.'
      }
    ]
  },
  // Add more events as needed for your mock data
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTicketType, setSelectedTicketType] = useState(0);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  // Getting the event data - would be fetched from API in a real app
  const event = id && events[id as keyof typeof events];

  // If event is not found, show error
  if (!event) {
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

  const handleBuyTicket = () => {
    console.log(`Buying ${ticketQuantity} tickets of type: ${event.ticketTypes[selectedTicketType].name}`);
    // In a real app, this would initiate the Solana wallet connection
    // and transaction to purchase the NFT ticket
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        {/* Hero image */}
        <div className="relative h-64 md:h-96 bg-gradient-to-r from-solana-purple/70 to-solana-blue/70">
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Event details section */}
            <div className="w-full lg:w-2/3">
              <div className="glass-card rounded-xl p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Link to="/events" className="text-muted-foreground hover:text-foreground flex items-center mr-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Events
                  </Link>
                  <Badge variant="outline" className="bg-accent">{event.category}</Badge>
                </div>
                
                <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                
                <div className="flex flex-wrap gap-y-4 mb-6">
                  <div className="flex items-center mr-6">
                    <Calendar className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center mr-6">
                    <Clock className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center mr-6">
                    <MapPin className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-solana-purple" />
                    <span>Organized by {event.organizer}</span>
                  </div>
                </div>
                
                <Tabs defaultValue="details">
                  <TabsList className="glass-card">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="tickets">Tickets</TabsTrigger>
                    <TabsTrigger value="nft">NFT Features</TabsTrigger>
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
                      {event.ticketTypes.map((ticketType, index) => (
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
                              <p className="font-bold text-lg text-solana-blue">{ticketType.price}</p>
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
                          <span>{parseFloat(event.ticketTypes[selectedTicketType].price) * ticketQuantity} SOL</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                          <span>Transaction Fee</span>
                          <span>0.001 SOL</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-4">
                          <span>Total</span>
                          <span>{(parseFloat(event.ticketTypes[selectedTicketType].price) * ticketQuantity + 0.001).toFixed(3)} SOL</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-solana-gradient hover:opacity-90 text-white"
                      onClick={handleBuyTicket}
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      Buy NFT Ticket
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
                </Tabs>
              </div>
            </div>
            
            {/* Ticket preview section */}
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
                        src={event.imageUrl} 
                        alt={event.title} 
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">{event.date}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">{event.time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{event.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ticket Type:</span>
                          <span className="font-medium text-solana-purple">
                            {event.ticketTypes[selectedTicketType].name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-bold text-solana-blue">{event.ticketTypes[selectedTicketType].price}</span>
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
    </div>
  );
};

export default EventDetailPage;
