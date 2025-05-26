
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import EventCard from './EventCard';
import { Link } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

const FeaturedEvents = () => {
  const { useEventsQuery } = useEvents();
  const { data: events = [], refetch, isLoading } = useEventsQuery();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get top 4 published events, sorted by date
  const featuredEvents = events
    .filter(event => event.is_published)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)
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

      // Format date properly
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
        category: 'Technology', // Default category when not specified in DB
        availability
      };
    });

  useEffect(() => {
    // Initial fetch of events
    refetch();
    
    // Enable real-time updates for the events table
    const channel = supabase.channel('featured-events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        async (payload) => {
          console.log('Real-time update received in Featured Events:', payload);
          
          // Immediately invalidate and refetch events
          await queryClient.invalidateQueries({ queryKey: ['events'] });
          await refetch();

          // Show toast notification for new published events
          if (payload.eventType === 'INSERT' && payload.new && payload.new.is_published) {
            toast({
              title: 'New Event Available',
              description: `"${payload.new.title}" is now available for booking!`,
            });
          }
          
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.is_published && payload.old && !payload.old.is_published) {
            toast({
              title: 'Event Published',
              description: `"${payload.new.title}" is now live and accepting bookings!`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast, queryClient]);

  if (isLoading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Button asChild variant="outline" className="glass-button">
              <Link to="/events">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="glass-card rounded-xl h-96 animate-pulse bg-muted/50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <Button asChild variant="outline" className="glass-button">
            <Link to="/events">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <ScrollArea className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  {...event}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No published events available yet. Create and publish the first event!</p>
                <Button asChild className="mt-4">
                  <Link to="/create">Create Event</Link>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
};

export default FeaturedEvents;
