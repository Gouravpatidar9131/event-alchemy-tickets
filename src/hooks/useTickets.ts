
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { initializeMetaplex, createNFTTicket, updateNFTTicketStatus } from '@/utils/metaplex';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMonadWallet } from '@/providers/MonadProvider';
import { toast } from '@/components/ui/sonner';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

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
  const solanaWallet = useWallet();
  const monadWallet = useMonadWallet();
  const { toast: uiToast } = useToast();
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
    currency,
    imageBuffer
  }: {
    eventId: string;
    eventDetails: any;
    ticketType: string;
    price: number;
    currency: 'SOL' | 'MONAD';
    imageBuffer: ArrayBuffer;
  }) => {
    if (!user) throw new Error('You must be logged in to purchase a ticket');
    
    const isValidWallet = 
      (currency === 'SOL' && solanaWallet.connected && solanaWallet.publicKey && solanaWallet.sendTransaction) ||
      (currency === 'MONAD' && monadWallet.connected && monadWallet.publicKey);
    
    if (!isValidWallet) {
      throw new Error(`Your ${currency} wallet must be connected`);
    }

    let recipientWallet: string | undefined = undefined;

    // First, get the event creator's ID
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('Event fetch error:', eventError);
      throw new Error("Unable to load event details for payment");
    }

    console.log("Event data:", eventData);

    // Then, fetch the creator's profile separately to get their wallet address
    if (eventData.creator_id) {
      const { data: creatorProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`wallet_address${currency === 'MONAD' ? ', monad_wallet_address' : ''}`)
        .eq('id', eventData.creator_id)
        .single();

      if (profileError) {
        console.error("Error fetching creator profile:", profileError);
      }
      
      // Validate if profile record and appropriate wallet_address exist
      if (creatorProfile) {
        if (currency === 'SOL' && typeof creatorProfile.wallet_address === "string" && creatorProfile.wallet_address.length > 0) {
          recipientWallet = creatorProfile.wallet_address;
          console.log("Found creator Solana wallet address:", recipientWallet);
        } else if (currency === 'MONAD' && typeof creatorProfile.monad_wallet_address === "string" && creatorProfile.monad_wallet_address.length > 0) {
          recipientWallet = creatorProfile.monad_wallet_address;
          console.log("Found creator Monad wallet address:", recipientWallet);
        }
      }
    }

    // Fallback to event details if no wallet address found in profile
    if (!recipientWallet) {
      recipientWallet = currency === 'SOL' 
        ? (eventDetails.wallet_address || eventDetails.organizer_wallet)
        : (eventDetails.monad_wallet_address || eventDetails.organizer_monad_wallet);
      console.log(`Using fallback ${currency} wallet address:`, recipientWallet);
    }

    if (!recipientWallet) {
      throw new Error(`Event organizer's ${currency} wallet address not found. Ask the event creator to set their ${currency} wallet address on their profile.`);
    }

    console.log(`Sending ${currency} payment to recipient:`, recipientWallet);

    // Process payment based on selected currency
    if (currency === 'SOL' && solanaWallet.publicKey && solanaWallet.sendTransaction) {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const recipientPubkey = new PublicKey(recipientWallet);
      const amountLamports = Math.floor(Number(price) * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: solanaWallet.publicKey,
          toPubkey: recipientPubkey,
          lamports: amountLamports,
        })
      );

      const blockHash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockHash.blockhash;
      transaction.feePayer = solanaWallet.publicKey;

      try {
        const signature = await solanaWallet.sendTransaction(transaction, connection);
        console.log('Transaction sent with signature:', signature);

        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value && confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }
        console.log('Payment confirmed:', signature);
      } catch (error: any) {
        console.error("Solana Payment Error:", error);
        throw new Error('Failed to send SOL payment: ' + (error.message || error));
      }
    } else if (currency === 'MONAD' && monadWallet.publicKey) {
      try {
        // Use our custom MonadWallet sendTransaction method
        const txHash = await monadWallet.sendTransaction(price, recipientWallet);
        console.log('Monad transaction successful:', txHash);
      } catch (error: any) {
        console.error("Monad Payment Error:", error);
        throw new Error('Failed to send MONAD payment: ' + (error.message || error));
      }
    }

    try {
      const purchaseDate = new Date().toISOString();
      const ticketData = {
        event_id: eventId,
        owner_id: user.id,
        mint_address: `mock-mint-${Date.now()}`,
        token_id: `mock-token-${Date.now()}`,
        status: 'active',
        purchase_price: price,
        purchase_date: purchaseDate,
        metadata: {
          ticket_type: ticketType,
          currency: currency
        }
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase
        .from('events')
        .update({
          tickets_sold: eventData.tickets_sold + 1
        })
        .eq('id', eventId);

      return data;
    } catch (error) {
      console.error('Error creating ticket record:', error);
      throw error;
    }
  };

  const checkInTicket = async (ticketId: string) => {
    if (!user) throw new Error('You must be logged in to check in a ticket');
    
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (ticketError) throw new Error(ticketError.message);
      if (ticket.status === 'used') throw new Error('This ticket has already been used');
      
      if (ticket.mint_address) {
        try {
          await updateNFTTicketStatus(ticket.mint_address, 'Used');
        } catch (nftError) {
          console.error('Error updating NFT status:', nftError);
        }
      }
      
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

  const purchaseTicketMutation = useMutation({
    mutationFn: purchaseTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
      queryClient.invalidateQueries({ queryKey: ['eventTickets', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.event_id] });
      uiToast({
        title: 'Ticket purchased',
        description: 'Your NFT ticket has been minted and added to your collection',
      });
    },
    onError: (error: any) => {
      uiToast({
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
      uiToast({
        title: 'Ticket checked in',
        description: 'The ticket has been marked as used',
      });
    },
    onError: (error: any) => {
      uiToast({
        title: 'Error checking in ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
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
    purchaseTicketMutation,
    checkInTicketMutation,
  };
};
