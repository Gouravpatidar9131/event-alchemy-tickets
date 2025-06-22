import { useState, useEffect } from 'react';
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
  const { data: eventsData = [], isLoading, refetch, error } = useEventsQuery();

  // Process events data to match the EventCard component format
  const processEvents = (events: any[]) => {
    console.log('Processing events:', events);
    return events
      .filter(event => {
        console.log('Event filter check:', event.id, 'is_published:', event.is_published);
        return event.is_published === true;
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
    console.log('Filtering events, raw data:', eventsData);
    const allEvents = processEvents(eventsData);
    console.log('Processed events:', allEvents);
    
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

    console.log('Filtered events result:', newFilteredEvents);
    setFilteredEvents(newFilteredEvents);
  };

  // Extract unique categories for filter dropdown
  const categories = eventsData.length > 0 
    ? [...new Set(processEvents(eventsData).map(event => event.category))] 
    : ['Technology', 'Music', 'Art', 'Business', 'Gaming', 'Networking'];

  useEffect(() => {
    console.log('Setting up real-time subscription for EventsPage');
    
    // Subscribe to real-time updates
    const channel = supabase.channel('events-page-realtime')
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
          try {
            await refetch();
            console.log('Events refetched successfully after real-time update');
          } catch (error) {
            console.error('Error refetching events:', error);
          }
          
          // Show notification for new published events
          if (payload.eventType === 'INSERT' && payload.new && payload.new.is_published) {
            toast({
              title: 'New Event Available',
              description: `A new event "${payload.new.title}" is now available!`,
            });
          }

          if (payload.eventType === 'UPDATE' && payload.new && payload.new.is_published && payload.old && !payload.old.is_published) {
            toast({
              title: 'Event Published',
              description: `"${payload.new.title}" is now live!`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  // Filter events when dependencies change
  useEffect(() => {
    console.log('Dependencies changed, filtering events');
    filterEvents();
  }, [searchTerm, categoryFilter, availabilityFilter, eventsData]);

  // Force refetch when component mounts and periodically
  useEffect(() => {
    console.log('EventsPage mounted, forcing initial refetch');
    refetch();
    
    // Set up periodic refetch every 30 seconds to ensure fresh data
    const interval = setInterval(() => {
      console.log('Periodic refetch triggered');
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('Events query error:', error);
      toast({
        title: 'Error loading events',
        description: 'Failed to load events. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="pt-24 pb-16 px-4">
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
        
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="glass-card rounded-xl h-96 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-xl text-destructive">
                Error loading events: {error.message}
              </p>
              <Button 
                variant="outline" 
                className="mt-4 glass-button"
                onClick={() => {
                  console.log('Manual refetch triggered');
                  refetch();
                }}
              >
                Try Again
              </Button>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
              {filteredEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  {...event}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                {eventsData.length === 0 
                  ? "No events have been created yet. Be the first to create one!" 
                  : "No events found matching your criteria."
                }
              </p>
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
      </div>
    </div>
  );
};

export default EventsPage;
