import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Mock data for events (expanded from FeaturedEvents)
const allEvents = [
  {
    id: '1',
    title: 'Solana Summer Hackathon',
    date: 'June 10, 2025',
    time: '9:00 AM - 6:00 PM',
    location: 'Virtual Event',
    imageUrl: 'https://images.unsplash.com/photo-1591522811280-a8759970b03f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '0.5 SOL',
    category: 'Technology',
    availability: 'available' as const,
  },
  {
    id: '2',
    title: 'Metaverse Music Festival',
    date: 'July 5, 2025',
    time: '8:00 PM - 2:00 AM',
    location: 'Decentraland',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '1.2 SOL',
    category: 'Music',
    availability: 'limited' as const,
  },
  {
    id: '3',
    title: 'NFT Art Exhibition',
    date: 'August 15, 2025',
    time: '10:00 AM - 6:00 PM',
    location: 'Miami, FL',
    imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1744&q=80',
    price: '0.8 SOL',
    category: 'Art',
    availability: 'available' as const,
  },
  {
    id: '4',
    title: 'Crypto Economics Summit',
    date: 'September 20, 2025',
    time: '9:00 AM - 5:00 PM',
    location: 'San Francisco, CA',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80',
    price: '1.5 SOL',
    category: 'Finance',
    availability: 'sold out' as const,
  },
  {
    id: '5',
    title: 'Blockchain Gaming Conference',
    date: 'October 5, 2025',
    time: '10:00 AM - 6:00 PM',
    location: 'Tokyo, Japan',
    imageUrl: 'https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80',
    price: '2.0 SOL',
    category: 'Gaming',
    availability: 'available' as const,
  },
  {
    id: '6',
    title: 'DeFi Developer Workshop',
    date: 'November 12, 2025',
    time: '9:00 AM - 5:00 PM',
    location: 'Berlin, Germany',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '0.7 SOL',
    category: 'Technology',
    availability: 'limited' as const,
  },
  {
    id: '7',
    title: 'Web3 Startup Pitch Competition',
    date: 'December 3, 2025',
    time: '2:00 PM - 8:00 PM',
    location: 'London, UK',
    imageUrl: 'https://images.unsplash.com/photo-1559223607-b4d0555ae227?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '1.0 SOL',
    category: 'Business',
    availability: 'available' as const,
  },
  {
    id: '8',
    title: 'Solana New Year Gala',
    date: 'December 31, 2025',
    time: '8:00 PM - 2:00 AM',
    location: 'New York, NY',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '3.0 SOL',
    category: 'Networking',
    availability: 'limited' as const,
  }
];

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // Changed from empty string to 'all'
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // Changed from empty string to 'all'
  const [filteredEvents, setFilteredEvents] = useState(allEvents);

  // Filter events based on search term and filters
  const filterEvents = () => {
    const matchesSearch = (event: any) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = (event: any) =>
      categoryFilter === 'all' || event.category === categoryFilter;

    const matchesAvailability = (event: any) =>
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && event.availability === 'available') ||
      (availabilityFilter === 'limited' && event.availability === 'limited') ||
      (availabilityFilter === 'sold out' && event.availability === 'sold out');

    const newFilteredEvents = allEvents.filter(
      (event: any) => matchesSearch(event) && matchesCategory(event) && matchesAvailability(event)
    );

    setFilteredEvents(newFilteredEvents);
  };

  // Extract unique categories for filter dropdown
  const categories = [...new Set(allEvents.map(event => event.category))];

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase.channel('events-page-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        async (payload) => {
          console.log('Real-time update received in Events Page:', payload);
          
          // Auto-refresh the events list when changes occur
          const updatedEvents = allEvents.slice(); // Create a copy of the events array
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Add the new event to the list
            updatedEvents.push(payload.new);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove the deleted event from the list
            const index = updatedEvents.findIndex(event => event.id === payload.old.id);
            if (index !== -1) {
              updatedEvents.splice(index, 1);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update the modified event in the list
            const index = updatedEvents.findIndex(event => event.id === payload.new.id);
            if (index !== -1) {
              updatedEvents[index] = payload.new;
            }
          }

          // Update the filtered events
          setFilteredEvents(updatedEvents);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [allEvents]);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, categoryFilter, availabilityFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">Discover Events</h1>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by name or location..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem> {/* Changed from empty string to 'all' */}
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem> {/* Changed from empty string to 'all' */}
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="sold out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="glass-button">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  {...event}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-muted-foreground">No events found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 glass-button"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all'); // Changed from empty string to 'all'
                    setAvailabilityFilter('all'); // Changed from empty string to 'all'
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventsPage;
