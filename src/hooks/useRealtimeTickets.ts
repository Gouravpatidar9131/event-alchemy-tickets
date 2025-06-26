
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';

export const useRealtimeTickets = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleTicketPurchase = useCallback((payload: any) => {
    console.log('Real-time ticket purchase detected:', payload);
    
    // Invalidate and refetch relevant queries immediately
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['userTickets'] });
    
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['eventTickets', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    }

    // Force immediate refetch to update UI
    queryClient.refetchQueries({ queryKey: ['events'] });
    if (eventId) {
      queryClient.refetchQueries({ queryKey: ['event', eventId] });
    }

    // Show toast notification for user's own ticket purchases
    if (payload.eventType === 'INSERT' && payload.new) {
      const ticketData = payload.new;
      
      // If this is the current user's ticket purchase, show success message
      if (user && ticketData.owner_id === user.id) {
        toast({
          title: 'Ticket Purchased Successfully!',
          description: 'Your ticket is now available in your dashboard with a unique QR code.',
          duration: 5000,
        });
      } else {
        // Someone else purchased a ticket for the same event
        toast({
          title: 'Ticket Purchased',
          description: 'Someone just purchased a ticket! Available spots are decreasing.',
          duration: 3000,
        });
      }
    }
  }, [queryClient, toast, eventId, user]);

  const handleEventUpdate = useCallback((payload: any) => {
    console.log('Real-time event update detected:', payload);
    
    // Invalidate queries for event updates and force immediate refetch
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.refetchQueries({ queryKey: ['events'] });
    
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.refetchQueries({ queryKey: ['event', eventId] });
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

  const handleTicketUpdate = useCallback((payload: any) => {
    console.log('Real-time ticket update detected:', payload);
    
    // Invalidate user tickets when any ticket is updated (status changes, etc.)
    queryClient.invalidateQueries({ queryKey: ['userTickets'] });
    queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
    
    // Force immediate refetch
    queryClient.refetchQueries({ queryKey: ['userTickets'] });
    queryClient.refetchQueries({ queryKey: ['userNFTs'] });
    
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['eventTickets', eventId] });
      queryClient.refetchQueries({ queryKey: ['eventTickets', eventId] });
    }

    // Show notification for ticket status changes
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      const newData = payload.new;
      const oldData = payload.old;
      
      // If this is the current user's ticket and status changed
      if (user && newData.owner_id === user.id && newData.status !== oldData.status) {
        if (newData.status === 'used') {
          toast({
            title: 'Ticket Checked In',
            description: 'Your ticket has been successfully checked in at the event.',
            duration: 5000,
          });
        }
      }
    }
  }, [queryClient, toast, eventId, user]);

  useEffect(() => {
    console.log('Setting up real-time subscriptions for tickets and events');
    
    // Subscribe to ticket changes (inserts and updates)
    const ticketsChannel = supabase
      .channel('realtime-tickets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets'
        },
        handleTicketPurchase
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        handleTicketUpdate
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
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [handleTicketPurchase, handleTicketUpdate, handleEventUpdate]);

  return {
    // This hook manages subscriptions internally
    isSubscribed: true
  };
};
