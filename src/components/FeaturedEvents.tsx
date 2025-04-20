
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import EventCard from './EventCard';
import { Link } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';

const FeaturedEvents = () => {
  const { useEventsQuery } = useEvents();
  const { data: events = [] } = useEventsQuery();

  // Get top 4 published events, sorted by date
  const featuredEvents = events
    .filter(event => event.is_published)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)
    .map(event => ({
      id: event.id,
      title: event.title,
      date: new Date(event.date).toLocaleDateString(),
      time: new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: event.location,
      imageUrl: event.image_url || 'https://images.unsplash.com/photo-1591522811280-a8759970b03f',
      price: `${event.price} SOL`,
      category: 'Technology', // You might want to add a category field to your events table
      availability: event.tickets_sold >= event.total_tickets ? 'sold out' : 
                   event.tickets_sold >= event.total_tickets * 0.8 ? 'limited' : 'available'
    }));

  useEffect(() => {
    // Subscribe to realtime updates for the events table
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          // Refetch events when changes occur
          useEventsQuery().refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
          {featuredEvents.map((event) => (
            <EventCard 
              key={event.id}
              {...event}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
