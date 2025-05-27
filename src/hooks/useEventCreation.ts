
import { useState } from 'react';
import { useEvents } from './useEvents';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export const useEventCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { createEventMutation } = useEvents();
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
      
      // Create the event (will be published by default due to database setting)
      const createdEvent = await createEventMutation.mutateAsync(eventData);
      console.log('Event created and published successfully:', createdEvent);
      
      // Force immediate cache invalidation and refetch for events
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.refetchQueries({ queryKey: ['events'] });
      
      // Wait a bit to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force immediate refresh of all events queries
      await queryClient.invalidateQueries({ queryKey: ['userEvents'] });
      
      toast({
        title: 'Event created',
        description: `Your event "${eventData.title}" has been created and published successfully`,
      });

      // Navigate to events page to see the published event
      setTimeout(() => {
        console.log('Navigating to events page');
        navigate('/events');
      }, 1500);

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
