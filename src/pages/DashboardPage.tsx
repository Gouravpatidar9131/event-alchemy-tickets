
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, Ticket, Clock, Award, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

// Mock data for owned tickets
const ownedTickets = [
  {
    id: '101',
    eventId: '1',
    eventTitle: 'Solana Summer Hackathon',
    eventDate: 'June 10, 2025',
    eventLocation: 'Virtual Event',
    ticketType: 'General Admission',
    price: '0.5 SOL',
    purchaseDate: 'May 15, 2024',
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1591522811280-a8759970b03f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: '102',
    eventId: '3',
    eventTitle: 'NFT Art Exhibition',
    eventDate: 'August 15, 2025',
    eventLocation: 'Miami, FL',
    ticketType: 'VIP Access',
    price: '1.2 SOL',
    purchaseDate: 'May 12, 2024',
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1744&q=80',
  },
  {
    id: '103',
    eventId: '5',
    eventTitle: 'Blockchain Gaming Conference',
    eventDate: 'October 5, 2024',
    eventLocation: 'Tokyo, Japan',
    ticketType: 'Standard Entry',
    price: '0.8 SOL',
    purchaseDate: 'March 20, 2024',
    status: 'checked-in',
    imageUrl: 'https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80',
  },
  {
    id: '104',
    eventId: '8',
    eventTitle: 'Solana New Year Gala 2024',
    eventDate: 'December 31, 2024',
    eventLocation: 'New York, NY',
    ticketType: 'VIP Pass',
    price: '2.0 SOL',
    purchaseDate: 'November 15, 2023',
    status: 'past',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  }
];

// Mock user stats data
const userStats = {
  eventsAttended: 6,
  totalSpent: '7.8 SOL',
  loyaltyLevel: 'Silver',
  loyaltyPoints: 45,
  nextLevelPoints: 75,
  perksUnlocked: 3,
  achievements: [
    { name: 'Early Bird', description: 'Purchased tickets within 24 hours of release', earned: true },
    { name: 'Event Explorer', description: 'Attended 5+ different event categories', earned: true },
    { name: 'Loyal Fan', description: 'Attended 3+ events from the same organizer', earned: true },
    { name: 'VIP Status', description: 'Purchased VIP tickets for 3+ events', earned: false },
    { name: 'Community Builder', description: 'Referred 5+ friends to events', earned: false },
  ]
};

const DashboardPage = () => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const toggleTicketExpand = (ticketId: string) => {
    if (selectedTicket === ticketId) {
      setSelectedTicket(null);
    } else {
      setSelectedTicket(ticketId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
          
          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="w-full mb-8 glass-card">
              <TabsTrigger value="tickets" className="flex-1">
                <Ticket className="h-4 w-4 mr-2" />
                My Tickets
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex-1">
                <Award className="h-4 w-4 mr-2" />
                Rewards & Loyalty
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tickets">
              <div className="grid grid-cols-1 gap-6">
                {ownedTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${
                      selectedTicket === ticket.id ? 'ticket-shadow' : ''
                    }`}
                  >
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => toggleTicketExpand(ticket.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={ticket.imageUrl} 
                            alt={ticket.eventTitle} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                            <h3 className="text-xl font-bold">{ticket.eventTitle}</h3>
                            <Badge 
                              variant={
                                ticket.status === 'upcoming' ? 'default' : 
                                ticket.status === 'checked-in' ? 'outline' : 'secondary'
                              }
                              className={
                                ticket.status === 'upcoming' ? 'bg-solana-blue text-black' : 
                                ticket.status === 'checked-in' ? 'border-solana-green text-solana-green' : ''
                              }
                            >
                              {ticket.status === 'upcoming' ? 'Upcoming' : 
                               ticket.status === 'checked-in' ? 'Checked In' : 'Past Event'}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-center text-sm text-muted-foreground gap-y-1 md:gap-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {ticket.eventDate}
                            </div>
                            <div className="flex items-center">
                              <Ticket className="h-4 w-4 mr-1" />
                              {ticket.ticketType}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex md:flex-col items-center justify-between md:justify-start md:items-end gap-2 mt-2 md:mt-0">
                          {ticket.status === 'upcoming' && (
                            <Button 
                              size="sm" 
                              className="w-full md:w-auto"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              Show QR
                            </Button>
                          )}
                          <Link to={`/events/${ticket.eventId}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full md:w-auto glass-button"
                            >
                              Event Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {selectedTicket === ticket.id && (
                      <div className="p-6 pt-0 border-t border-border mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold mb-4">Ticket Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ticket ID:</span>
                                <span>{ticket.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Purchase Date:</span>
                                <span>{ticket.purchaseDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Price Paid:</span>
                                <span>{ticket.price}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span>{ticket.eventLocation}</span>
                              </div>
                            </div>
                            
                            <div className="mt-6 space-x-2">
                              <Button variant="outline" size="sm" className="glass-button">
                                Transfer Ticket
                              </Button>
                              <Button variant="outline" size="sm" className="glass-button">
                                List for Sale
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center text-center bg-card rounded-lg p-6">
                            <div className="mb-4">
                              {ticket.status === 'upcoming' ? (
                                <>
                                  <Clock className="h-10 w-10 mx-auto mb-2 text-solana-purple" />
                                  <h4 className="font-bold">Event Starts In</h4>
                                  <p className="text-2xl font-bold mt-2">15 Days</p>
                                </>
                              ) : ticket.status === 'checked-in' ? (
                                <>
                                  <Badge className="bg-solana-green text-black px-4 py-2 text-lg">Checked In</Badge>
                                  <p className="mt-4 text-muted-foreground">
                                    Your NFT ticket has evolved to its event attendance state.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Award className="h-10 w-10 mx-auto mb-2 text-solana-blue" />
                                  <h4 className="font-bold">Collectible NFT</h4>
                                  <p className="mt-2 text-muted-foreground">
                                    This ticket is now a permanent collectible in your wallet.
                                  </p>
                                </>
                              )}
                            </div>
                            
                            <div className="w-full mt-4">
                              <Button className="w-full">
                                View NFT in Wallet
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="rewards">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="glass-card p-6 rounded-xl mb-6">
                    <h3 className="text-xl font-bold mb-4">Loyalty Status</h3>
                    
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-solana-gradient rounded-full flex items-center justify-center mr-4">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gradient">{userStats.loyaltyLevel} Member</h4>
                        <p className="text-sm text-muted-foreground">Attended {userStats.eventsAttended} events</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress to Gold Level</span>
                        <span className="text-sm font-medium">{userStats.loyaltyPoints}/{userStats.nextLevelPoints} points</span>
                      </div>
                      <Progress value={(userStats.loyaltyPoints / userStats.nextLevelPoints) * 100} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-card rounded-lg text-center">
                        <h5 className="font-medium text-muted-foreground text-sm mb-1">Events Attended</h5>
                        <p className="text-2xl font-bold">{userStats.eventsAttended}</p>
                      </div>
                      <div className="p-4 bg-card rounded-lg text-center">
                        <h5 className="font-medium text-muted-foreground text-sm mb-1">Total Spent</h5>
                        <p className="text-2xl font-bold">{userStats.totalSpent}</p>
                      </div>
                      <div className="p-4 bg-card rounded-lg text-center">
                        <h5 className="font-medium text-muted-foreground text-sm mb-1">Perks Unlocked</h5>
                        <p className="text-2xl font-bold">{userStats.perksUnlocked}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-4">Current Benefits</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm">
                          <div className="w-4 h-4 rounded-full bg-solana-gradient mr-2"></div>
                          Early access to ticket sales (24 hours)
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-4 h-4 rounded-full bg-solana-gradient mr-2"></div>
                          5% discount on standard tickets
                        </li>
                        <li className="flex items-center text-sm">
                          <div className="w-4 h-4 rounded-full bg-solana-gradient mr-2"></div>
                          Exclusive member event invitations
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="glass-card p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Your Achievements</h3>
                      <Badge variant="outline" className="bg-accent">
                        {userStats.achievements.filter(a => a.earned).length}/{userStats.achievements.length} Earned
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {userStats.achievements.map((achievement, index) => (
                        <div 
                          key={index}
                          className={`p-4 rounded-lg flex items-center ${
                            achievement.earned ? 'bg-solana-purple/10 border border-solana-purple/30' : 'bg-card'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                            achievement.earned ? 'bg-solana-gradient' : 'bg-muted'
                          }`}>
                            {achievement.earned ? (
                              <Award className="h-5 w-5 text-white" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="glass-card p-6 rounded-xl mb-6">
                    <h3 className="font-bold mb-4">Upcoming Perks</h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-card rounded-lg">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-5 w-5 mr-2 text-solana-purple" />
                          <h4 className="font-bold">Early Bird Access</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Special pre-sale for Metaverse Music Festival starts in 3 days.
                        </p>
                        <Button size="sm" className="w-full" variant="outline">
                          Set Reminder
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-card rounded-lg">
                        <div className="flex items-center mb-2">
                          <Gift className="h-5 w-5 mr-2 text-solana-purple" />
                          <h4 className="font-bold">Member Airdrop</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Exclusive NFT drop for Silver members on June 1.
                        </p>
                        <Button size="sm" className="w-full" variant="outline">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="font-bold mb-4">Upgrade Your Status</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You're 30 points away from Gold status which unlocks:
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-sm">
                        <ArrowUpRight className="h-4 w-4 mr-2 text-solana-purple" />
                        48-hour early access to events
                      </li>
                      <li className="flex items-center text-sm">
                        <ArrowUpRight className="h-4 w-4 mr-2 text-solana-purple" />
                        10% discount on all tickets
                      </li>
                      <li className="flex items-center text-sm">
                        <ArrowUpRight className="h-4 w-4 mr-2 text-solana-purple" />
                        Priority check-in at events
                      </li>
                    </ul>
                    
                    <Button className="w-full bg-solana-gradient hover:opacity-90 text-white">
                      View Upcoming Events
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Add this missing icon import
const Lock = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Gift = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 5 0 0 1 12 8a4.8 5 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

export default DashboardPage;
