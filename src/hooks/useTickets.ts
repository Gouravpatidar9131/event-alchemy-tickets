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
  profiles?: {
    display_name?: string;
  };
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
  currency: 'ETH' | 'USD' | 'FREE' | 'MATIC' | 'AVAX';
  imageBuffer: ArrayBuffer;
  paymentMethod: 'free' | 'stripe' | 'ethereum';
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
      .select(`
        *,
        profiles (
          display_name
        )
      `)
      .eq('event_id', eventId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching event tickets:', error);
      throw new Error(error.message);
    }
    console.log('Event tickets fetched successfully:', data);
    return data as Ticket[];
  }, []);

  const ensureUserProfile = async () => {
    if (!user) return false;
    
    console.log('Checking user profile exists...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Creating user profile...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: user.email?.split('@')[0] || 'Anonymous User'
        });
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw new Error('Failed to create user profile');
      }
      return true;
    } else if (error) {
      console.error('Error checking profile:', error);
      throw new Error('Failed to verify user profile');
    }
    
    return true;
  };

  const purchaseTicket = async (params: PurchaseTicketParams) => {
    if (!user) throw new Error('You must be logged in to purchase tickets');
    
    try {
      console.log("Purchasing ticket with params:", params);
      
      // Ensure user profile exists
      await ensureUserProfile();
      
      // Validate payment method and price
      if (params.paymentMethod === 'free' && params.price > 0) {
        throw new Error('Free tickets cannot have a price');
      }
      
      if (params.paymentMethod === 'stripe' && params.price <= 0) {
        throw new Error('Stripe payments require a valid price');
      }
      
      if (params.paymentMethod === 'ethereum' && params.price <= 0) {
        throw new Error('Ethereum payments require a valid price');
      }

      // Create ticket record in database
      const ticketData = {
        event_id: params.eventId,
        owner_id: user.id,
        purchase_price: params.price,
        metadata: {
          ticketType: params.ticketType,
          eventDetails: params.eventDetails,
          currency: params.currency,
          paymentMethod: params.paymentMethod
        },
        status: 'active' as const
      };

      console.log('Inserting ticket with data:', ticketData);

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to create ticket: ${error.message}`);
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
      console.error('Purchase ticket mutation error:', error);
      toast({
        title: 'Error purchasing ticket',
        description: error.message || 'An unexpected error occurred',
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
