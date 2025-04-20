
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import EventCard from './EventCard';
import { Link } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const FeaturedEvents = () => {
  const { useEventsQuery } = useEvents();
  const { data: events = [], refetch } = useEventsQuery();
  const { toast } = useToast();

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

      return {
        id: event.id,
        title: event.title,
        date: format(eventDate, 'PP'),
        time: format(eventDate, 'p'),
        location: event.location,
        imageUrl: event.image_url || 'https://images.unsplash.com/photo-1591522811280-a8759970b03f',
        price: `${event.price} SOL`,
        category: event.category || 'Technology',
        availability
      };
    });

  useEffect(() => {
    // Initial fetch of events
    refetch();
    
    // Enable real-time updates for the events table
    const channel = supabase.channel('featured-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        async (payload) => {
          console.log('Real-time update received in Featured Events:', payload);
          
          // Refetch events when changes occur
          await refetch();

          // Show toast notification for new events
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Event Added',
              description: `"${payload.new.title}" has been added to the events list.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

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
          {featuredEvents.length > 0 ? (
            featuredEvents.map((event) => (
              <EventCard 
                key={event.id}
                {...event}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events available. Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
