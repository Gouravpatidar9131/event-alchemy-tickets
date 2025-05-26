
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

export interface Ticket {
  id: string;
  event_id: string;
  owner_id: string;
  purchase_price: number;
  purchase_date: string;
  checked_in_at?: string;
  metadata?: any;
  mint_address?: string;
  token_id?: string;
  status: 'active' | 'used' | 'cancelled';
}

export interface PurchaseTicketParams {
  eventId: string;
  eventDetails: {
    title: string;
    date: string;
    location: string;
    ticketType: string;
    tickets_sold: number;
  };
  ticketType: string;
  price: number;
  currency: 'SOL';
  imageBuffer: ArrayBuffer;
}

export const useTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchUserTickets = useCallback(async () => {
    if (!user) {
      console.log('No user logged in, returning empty array for user tickets');
      return [];
    }
    
    console.log(`Fetching tickets for user: ${user.id}`);
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (
          title,
          date,
          location,
          image_url
        )
      `)
      .eq('owner_id', user.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching user tickets:', error);
      throw new Error(error.message);
    }
    console.log('User tickets fetched successfully:', data);
    return data as Ticket[];
  }, [user]);

  const fetchEventTickets = useCallback(async (eventId: string) => {
    console.log(`Fetching tickets for event: ${eventId}`);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching event tickets:', error);
      throw new Error(error.message);
    }
    console.log('Event tickets fetched successfully:', data);
    return data as Ticket[];
  }, []);

  const purchaseTicket = async (params: PurchaseTicketParams) => {
    if (!user) throw new Error('You must be logged in to purchase tickets');
    
    try {
      console.log("Purchasing ticket with params:", params);
      
      // Create ticket record in database
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          event_id: params.eventId,
          owner_id: user.id,
          purchase_price: params.price,
          metadata: {
            ticketType: params.ticketType,
            eventDetails: params.eventDetails
          },
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message);
      }

      // Update event tickets_sold count
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          tickets_sold: params.eventDetails.tickets_sold + 1 
        })
        .eq('id', params.eventId);

      if (updateError) {
        console.error("Error updating tickets_sold:", updateError);
        // Don't throw here as the ticket was created successfully
      }
      
      console.log("Ticket purchased successfully:", ticket);
      return ticket as Ticket;
    } catch (error: any) {
      console.error("Error purchasing ticket:", error);
      throw error;
    }
  };

  const checkInTicket = async (ticketId: string) => {
    if (!user) throw new Error('You must be logged in to check in tickets');
    
    try {
      console.log(`Checking in ticket ${ticketId}`);
      const { data, error } = await supabase
        .from('tickets')
        .update({
          checked_in_at: new Date().toISOString(),
          status: 'used'
        })
        .eq('id', ticketId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        console.error(`Error checking in ticket ${ticketId}:`, error);
        throw new Error(error.message);
      }
      console.log('Ticket checked in successfully:', data);
      return data as Ticket;
    } catch (error: any) {
      console.error("Error checking in ticket:", error);
      throw error;
    }
  };

  const useUserTicketsQuery = () => useQuery({
    queryKey: ['userTickets'],
    queryFn: fetchUserTickets,
    enabled: !!user,
  });

  const useEventTicketsQuery = (eventId: string) => useQuery({
    queryKey: ['eventTickets', eventId],
    queryFn: () => fetchEventTickets(eventId),
    enabled: !!eventId,
  });

  const purchaseTicketMutation = useMutation({
    mutationFn: purchaseTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['eventTickets'] });
      toast({
        title: 'Ticket purchased',
        description: 'Your ticket has been purchased successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error purchasing ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const checkInTicketMutation = useMutation({
    mutationFn: checkInTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
      queryClient.invalidateQueries({ queryKey: ['eventTickets'] });
      toast({
        title: 'Ticket checked in',
        description: 'Ticket has been successfully checked in',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error checking in ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    useUserTicketsQuery,
    useEventTicketsQuery,
    purchaseTicketMutation,
    checkInTicketMutation,
  };
};
