
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useCallback } from 'react';

export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  price: number;
  total_tickets: number;
  tickets_sold: number;
  creator_id: string;
  mint_address?: string;
  candy_machine_id?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export const useEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchEvents = useCallback(async () => {
    console.log('Fetching all events');
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      throw new Error(error.message);
    }
    console.log('Events fetched successfully:', data);
    return data as Event[];
  }, []);

  const fetchEvent = async (id: string) => {
    console.log(`Fetching event with id: ${id}`);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw new Error(error.message);
    }
    console.log('Event fetched successfully:', data);
    return data as Event;
  };

  const fetchUserEvents = async () => {
    if (!user) {
      console.log('No user logged in, returning empty array for user events');
      return [];
    }
    
    console.log(`Fetching events for user: ${user.id}`);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user events:', error);
      throw new Error(error.message);
    }
    console.log('User events fetched successfully:', data);
    return data as Event[];
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'tickets_sold' | 'is_published' | 'creator_id'>) => {
    if (!user) throw new Error('You must be logged in to create an event');
    
    try {
      console.log("Creating event with data:", eventData);
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          creator_id: user.id,
          tickets_sold: 0,
          is_published: false
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message);
      }
      
      console.log("Event created successfully:", data);
      return data as Event;
    } catch (error: any) {
      console.error("Error creating event:", error);
      throw error;
    }
  };

  const updateEvent = async ({ id, ...eventData }: Partial<Event> & { id: string }) => {
    if (!user) throw new Error('You must be logged in to update an event');
    
    try {
      console.log(`Updating event ${id} with data:`, eventData);
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating event ${id}:`, error);
        throw new Error(error.message);
      }
      console.log('Event updated successfully:', data);
      return data as Event;
    } catch (error: any) {
      console.error("Error updating event:", error);
      throw error;
    }
  };

  const publishEvent = async (id: string, mintAddress?: string, candyMachineId?: string) => {
    if (!user) throw new Error('You must be logged in to publish an event');
    
    try {
      console.log(`Publishing event ${id}`);
      const { data, error } = await supabase
        .from('events')
        .update({
          is_published: true,
          mint_address: mintAddress,
          candy_machine_id: candyMachineId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error publishing event ${id}:`, error);
        throw new Error(error.message);
      }
      console.log('Event published successfully:', data);
      return data as Event;
    } catch (error: any) {
      console.error("Error publishing event:", error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) throw new Error('You must be logged in to delete an event');
    
    try {
      console.log(`Deleting event ${id}`);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting event ${id}:`, error);
        throw new Error(error.message);
      }
      console.log(`Event ${id} deleted successfully`);
      return { id };
    } catch (error: any) {
      console.error("Error deleting event:", error);
      throw error;
    }
  };

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      // Optimistically update the cache
      queryClient.setQueryData(['event', data.id], data);
      
      // Add to events list cache
      queryClient.setQueryData(['events'], (oldData: Event[] = []) => {
        return [data, ...oldData];
      });
      
      // Add to user events cache
      queryClient.setQueryData(['userEvents'], (oldData: Event[] = []) => {
        return [data, ...oldData];
      });
      
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['userEvents'] });
      
      toast({
        title: 'Event created',
        description: 'Your event has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: (data) => {
      // Update individual event cache
      queryClient.setQueryData(['event', data.id], data);
      
      // Update events list cache
      queryClient.setQueryData(['events'], (oldData: Event[] = []) => {
        return oldData.map(event => event.id === data.id ? data : event);
      });
      
      // Update user events cache
      queryClient.setQueryData(['userEvents'], (oldData: Event[] = []) => {
        return oldData.map(event => event.id === data.id ? data : event);
      });
      
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['userEvents'] });
      
      toast({
        title: 'Event updated',
        description: 'Your event has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const publishEventMutation = useMutation({
    mutationFn: ({ id, mintAddress, candyMachineId }: { id: string, mintAddress?: string, candyMachineId?: string }) => 
      publishEvent(id, mintAddress, candyMachineId),
    onSuccess: (data) => {
      // Update all relevant caches
      queryClient.setQueryData(['event', data.id], data);
      
      queryClient.setQueryData(['events'], (oldData: Event[] = []) => {
        return oldData.map(event => event.id === data.id ? data : event);
      });
      
      queryClient.setQueryData(['userEvents'], (oldData: Event[] = []) => {
        return oldData.map(event => event.id === data.id ? data : event);
      });
      
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['userEvents'] });
      
      toast({
        title: 'Event published',
        description: 'Your event is now live and tickets can be purchased',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error publishing event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['userEvents'] });
      toast({
        title: 'Event deleted',
        description: 'Your event has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setupRealtimeSubscription = useCallback(() => {
    console.log('Setting up real-time subscription for events');
    
    const channel = supabase
      .channel('events-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        async (payload) => {
          console.log('Real-time update received in useEvents:', payload);
          
          // Optimistic updates for better UX
          if (payload.eventType === 'INSERT' && payload.new) {
            const newEvent = payload.new as Event;
            
            queryClient.setQueryData(['events'], (oldData: Event[] = []) => {
              // Avoid duplicates
              if (oldData.some(event => event.id === newEvent.id)) {
                return oldData;
              }
              return [newEvent, ...oldData];
            });
            
            if (user && newEvent.creator_id === user.id) {
              queryClient.setQueryData(['userEvents'], (oldData: Event[] = []) => {
                if (oldData.some(event => event.id === newEvent.id)) {
                  return oldData;
                }
                return [newEvent, ...oldData];
              });
            }
          }
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedEvent = payload.new as Event;
            
            queryClient.setQueryData(['events'], (oldData: Event[] = []) => {
              return oldData.map(event => 
                event.id === updatedEvent.id ? updatedEvent : event
              );
            });
            
            queryClient.setQueryData(['event', updatedEvent.id], updatedEvent);
          }
          
          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedEvent = payload.old as Event;
            
            queryClient.setQueryData(['events'], (oldData: Event[] = []) => {
              return oldData.filter(event => event.id !== deletedEvent.id);
            });
            
            queryClient.removeQueries({ queryKey: ['event', deletedEvent.id] });
          }
          
          // Force refetch for consistency
          await queryClient.refetchQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Removing real-time subscription for events');
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  const useEventsQuery = () => {
    const query = useQuery({
      queryKey: ['events'],
      queryFn: fetchEvents,
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60, // Refetch every minute
    });

    useEffect(() => {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }, [setupRealtimeSubscription]);

    return query;
  };

  return {
    useEventsQuery,
    useEventQuery: (id: string) => useQuery({
      queryKey: ['event', id],
      queryFn: () => fetchEvent(id),
      enabled: !!id,
    }),
    useUserEventsQuery: () => useQuery({
      queryKey: ['userEvents'],
      queryFn: fetchUserEvents,
      enabled: !!user,
    }),
    createEventMutation,
    updateEventMutation,
    publishEventMutation,
    deleteEventMutation,
  };
};
