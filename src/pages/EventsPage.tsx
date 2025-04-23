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
import { useToast } from '@/components/ui/use-toast';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const { toast } = useToast();
  const { useEventsQuery } = useEvents();
  const { data: eventsData = [], isLoading, error, refetch } = useEventsQuery();

  useEffect(() => {
    // Initial fetch of events
    console.log('Initial fetch of events');
    refetch();
  }, [refetch]);

  // Process events data to match the EventCard component format
  const processEvents = (events: any[]) => {
    console.log('Processing events:', events.length);
    return events
      .filter(event => {
        const isPublished = event.is_published;
        if (!isPublished) {
          console.log(`Event ${event.id} (${event.title}) is not published, filtering out`);
        }
        return isPublished;
      })
      .map(event => {
        // Determine availability based on ticket sales
        let availability: "sold out" | "limited" | "available";
        if (event.tickets_sold >= event.total_tickets) {
          availability = "sold out";
        } else if (event.tickets_sold >= event.total_tickets * 0.8) {
          availability = "limited";
        } else {
          availability = "available";
        }

        // Format date and time for display
        const eventDate = new Date(event.date);
        
        // Use a default image if none is provided
        const defaultImage = 'https://images.unsplash.com/photo-1591522811280-a8759970b03f';
        
        return {
          id: event.id,
          title: event.title,
          date: format(eventDate, 'PP'),
          time: format(eventDate, 'p'),
          location: event.location,
          imageUrl: event.image_url && event.image_url.trim() !== '' ? event.image_url : defaultImage,
          price: `${event.price} SOL`,
          category: 'Technology', // Default category if not specified
          availability
        };
      });
  };

  // Filter events based on search term and filters
  const filterEvents = () => {
    const allEvents = processEvents(eventsData);
    
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
  const categories = eventsData.length > 0 
    ? [...new Set(processEvents(eventsData).map(event => event.category))] 
    : ['Technology', 'Music', 'Art', 'Business', 'Gaming', 'Networking'];

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
          
          // Refetch events when database changes occur
          await refetch();
          
          // Show notification for new events
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Event Added',
              description: `A new event has been added to the list.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  // Initial load and when filters change
  useEffect(() => {
    if (eventsData.length > 0) {
      filterEvents();
    }
  }, [searchTerm, categoryFilter, availabilityFilter, eventsData]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error loading events',
        description: 'There was a problem loading the events. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

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
                    <SelectItem value="all">All Categories</SelectItem>
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
                    <SelectItem value="all">All Tickets</SelectItem>
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
          
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-muted-foreground">Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  {...event}
                />
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-muted-foreground">No events found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4 glass-button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setAvailabilityFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventsPage;
