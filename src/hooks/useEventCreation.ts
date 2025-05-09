
import { useState } from 'react';
import { useEvents } from './useEvents';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useEventCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { createEventMutation, publishEventMutation } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    price: number;
    total_tickets: number;
    image_url: string;
    category?: string;
    isPublished?: boolean;
  }) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create an event',
        variant: 'destructive',
      });
      return false;
    }

    setIsCreating(true);
    try {
      console.log('Creating event with data:', eventData);
      
      const { isPublished, ...eventDataToCreate } = eventData;

      // Create the event
      const createdEvent = await createEventMutation.mutateAsync(eventDataToCreate);
      console.log('Event created successfully:', createdEvent);
      
      // If requested, publish the event right away
      if (isPublished && createdEvent) {
        console.log('Publishing event:', createdEvent.id);
        await publishEventMutation.mutateAsync({ 
          id: createdEvent.id 
        });
        console.log('Event published successfully');
      }

      // Force immediate refresh of the events queries
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['userEvents'] });
      
      // Set up real-time subscription for this event
      const channel = supabase.channel(`event-${createdEvent.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: `id=eq.${createdEvent.id}`
          },
          async (payload) => {
            console.log('Real-time update received for new event:', payload);
            await queryClient.invalidateQueries({ queryKey: ['events'] });
            await queryClient.invalidateQueries({ queryKey: ['event', createdEvent.id] });
            await queryClient.invalidateQueries({ queryKey: ['userEvents'] });
          }
        )
        .subscribe();
      
      toast({
        title: 'Event created',
        description: `Your event "${eventData.title}" has been ${isPublished ? 'created and published' : 'saved as draft'}`,
      });

      // Navigate to events page after successful creation
      if (isPublished) {
        // Small delay to allow Supabase to update
        setTimeout(() => {
          navigate('/events');
        }, 1500);
      } else {
        // If not published, go to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }

      return true;
    } catch (error: any) {
      console.error('Error in createEvent:', error);
      toast({
        title: 'Error creating event',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createEvent,
    isCreating
  };
};
