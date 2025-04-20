
import { useState } from 'react';
import { useEvents } from './useEvents';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

export const useEventCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { createEventMutation } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();

  const createEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    price: number;
    total_tickets: number;
    image_url?: string;
  }) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create an event',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // Pass the data without creator_id as it's handled in the createEvent function
      await createEventMutation.mutateAsync(eventData);

      toast({
        title: 'Event created',
        description: 'Your event has been created successfully',
      });

      return true;
    } catch (error: any) {
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
