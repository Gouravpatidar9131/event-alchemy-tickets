
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useRealtimeTickets = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleTicketPurchase = useCallback((payload: any) => {
    console.log('Real-time ticket purchase detected:', payload);
    
    // Invalidate and refetch relevant queries
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['userTickets'] });
    
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['eventTickets', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    }

    // Show toast notification for new ticket purchases
    if (payload.eventType === 'INSERT' && payload.new) {
      const ticketData = payload.new;
      toast({
        title: 'Ticket Purchased',
        description: 'Someone just purchased a ticket! Available spots are decreasing.',
        duration: 3000,
      });
    }
  }, [queryClient, toast, eventId]);

  const handleEventUpdate = useCallback((payload: any) => {
    console.log('Real-time event update detected:', payload);
    
    // Invalidate queries for event updates
    queryClient.invalidateQueries({ queryKey: ['events'] });
    
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    }

    // Show notification for significant event changes
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      const newData = payload.new;
      const oldData = payload.old;
      
      // Check if tickets_sold changed
      if (newData.tickets_sold !== oldData.tickets_sold) {
        const remainingTickets = newData.total_tickets - newData.tickets_sold;
        
        if (remainingTickets <= 5 && remainingTickets > 0) {
          toast({
            title: 'Limited Tickets Remaining',
            description: `Only ${remainingTickets} tickets left for this event!`,
            duration: 5000,
          });
        } else if (remainingTickets === 0) {
          toast({
            title: 'Event Sold Out',
            description: 'This event is now sold out!',
            variant: 'destructive',
            duration: 5000,
          });
        }
      }
    }
  }, [queryClient, toast, eventId]);

  useEffect(() => {
    // Subscribe to ticket changes
    const ticketsChannel = supabase
      .channel('realtime-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        handleTicketPurchase
      )
      .subscribe();

    // Subscribe to event changes
    const eventsChannel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events'
        },
        handleEventUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [handleTicketPurchase, handleEventUpdate]);

  return {
    // This hook manages subscriptions internally
    isSubscribed: true
  };
};
