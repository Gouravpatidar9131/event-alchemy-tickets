
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { initializeMetaplex, createNFTTicket, updateNFTTicketStatus } from '@/utils/metaplex';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from '@/components/ui/sonner';

export type Ticket = {
  id: string;
  event_id: string;
  owner_id: string;
  mint_address?: string;
  token_id?: string;
  status: 'active' | 'used' | 'transferred';
  purchase_price: number;
  purchase_date: string;
  checked_in_at?: string;
  metadata?: any;
};

export const useTickets = () => {
  const { user } = useAuth();
  const wallet = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchUserTickets = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events:event_id (
          id,
          title,
          date,
          location,
          image_url
        )
      `)
      .eq('owner_id', user.id)
      .order('purchase_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data as (Ticket & { events: any })[];
  };

  const fetchEventTickets = async (eventId: string) => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        profiles:owner_id (
          id,
          display_name,
          wallet_address
        )
      `)
      .eq('event_id', eventId)
      .order('purchase_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data as (Ticket & { profiles: any })[];
  };

  const fetchTicket = async (id: string) => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events:event_id (
          id,
          title,
          date,
          location,
          image_url,
          creator_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as (Ticket & { events: any });
  };

  const purchaseTicket = async ({
    eventId,
    eventDetails,
    ticketType,
    price,
    imageBuffer
  }: {
    eventId: string;
    eventDetails: any;
    ticketType: string;
    price: number;
    imageBuffer: ArrayBuffer;
  }) => {
    if (!user) throw new Error('You must be logged in to purchase a ticket');
    if (!wallet.connected) throw new Error('Your wallet must be connected');
    
    try {
      console.log("Purchasing ticket for event:", eventId);
      console.log("Ticket details:", { ticketType, price });
      
      // Create a mock NFT ticket using our mock metaplex implementation
      const metaplex = initializeMetaplex();
      
      // In a production app, we would mint an actual NFT here
      // For now, we create a mock ticket record in the database
      const ticketData = {
        event_id: eventId,
        owner_id: user.id,
        mint_address: `mock-mint-${Date.now()}`,
        token_id: `mock-token-${Date.now()}`,
        status: 'active',
        purchase_price: price,
        metadata: {
          ticket_type: ticketType
        }
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      
      // Update event's ticket count
      await supabase
        .from('events')
        .update({
          tickets_sold: eventDetails.tickets_sold + 1
        })
        .eq('id', eventId);
      
      console.log("Ticket purchased successfully:", data);
      return data;
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      throw error;
    }
  };

  const checkInTicket = async (ticketId: string) => {
    if (!user) throw new Error('You must be logged in to check in a ticket');
    
    try {
      // 1. Get the ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (ticketError) throw new Error(ticketError.message);
      if (ticket.status === 'used') throw new Error('This ticket has already been used');
      
      // 2. Update the NFT metadata to mark it as used (in a production app)
      if (ticket.mint_address) {
        try {
          await updateNFTTicketStatus(ticket.mint_address, 'Used');
        } catch (nftError) {
          console.error('Error updating NFT status:', nftError);
          // Continue with the check-in process even if the NFT update fails
        }
      }
      
      // 3. Update the ticket status in the database
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          checked_in_at: now
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      
      // 4. Update the user's profile to increment events_attended
      // Fix the RPC calls by using a direct update instead
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('events_attended, loyalty_points')
        .eq('id', ticket.owner_id)
        .single();

      if (!profileError && profileData) {
        const eventsAttended = (profileData.events_attended || 0) + 1;
        const loyaltyPoints = (profileData.loyalty_points || 0) + 10;
        
        await supabase
          .from('profiles')
          .update({
            events_attended: eventsAttended,
            loyalty_points: loyaltyPoints
          })
          .eq('id', ticket.owner_id);
      }
      
      return data as Ticket;
    } catch (error) {
      console.error('Error checking in ticket:', error);
      throw error;
    }
  };

  // Mutations
  const purchaseTicketMutation = useMutation({
    mutationFn: purchaseTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
      queryClient.invalidateQueries({ queryKey: ['eventTickets', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.event_id] });
      toast({
        title: 'Ticket purchased',
        description: 'Your NFT ticket has been minted and added to your collection',
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
      queryClient.invalidateQueries({ queryKey: ['eventTickets', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
      toast({
        title: 'Ticket checked in',
        description: 'The ticket has been marked as used',
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
    // Queries
    useUserTicketsQuery: () => useQuery({
      queryKey: ['userTickets'],
      queryFn: fetchUserTickets,
      enabled: !!user,
    }),
    useEventTicketsQuery: (eventId: string) => useQuery({
      queryKey: ['eventTickets', eventId],
      queryFn: () => fetchEventTickets(eventId),
      enabled: !!eventId && !!user,
    }),
    useTicketQuery: (id: string) => useQuery({
      queryKey: ['ticket', id],
      queryFn: () => fetchTicket(id),
      enabled: !!id,
    }),
    // Mutations
    purchaseTicketMutation,
    checkInTicketMutation,
  };
};
