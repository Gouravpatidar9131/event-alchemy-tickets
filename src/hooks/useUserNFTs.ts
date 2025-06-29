
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export interface UserNFT {
  id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  nft_mint_address: string | null;
  nft_metadata_uri: string | null;
  nft_status: string | null;
  nft_minted_at: string | null;
  checked_in_at: string;
  source: 'attendance' | 'ticket';
}

export const useUserNFTs = () => {
  const { user } = useAuth();

  const fetchUserNFTs = async (): Promise<UserNFT[]> => {
    if (!user) return [];

    console.log(`Fetching NFTs for user: ${user.id}`);

    // Get NFTs from attendance table where the user is the attendee (NFTs minted for this user)
    const { data: attendanceNFTs, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        event_id,
        attendee_id,
        nft_mint_address,
        nft_metadata_uri,
        nft_status,
        nft_minted_at,
        checked_in_at,
        events!attendance_event_id_fkey (
          title,
          date
        )
      `)
      .eq('attendee_id', user.id)
      .not('nft_status', 'is', null)
      .order('checked_in_at', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance NFTs:', attendanceError);
    }

    // Get NFTs from tickets that belong to this user and have been minted (ticket-based NFTs)
    const { data: ticketNFTs, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        event_id,
        owner_id,
        mint_address,
        metadata,
        checked_in_at,
        events!tickets_event_id_fkey (
          title,
          date
        )
      `)
      .eq('owner_id', user.id)
      .not('mint_address', 'is', null)
      .not('checked_in_at', 'is', null)
      .order('checked_in_at', { ascending: false });

    if (ticketError) {
      console.error('Error fetching ticket NFTs:', ticketError);
    }

    const allNFTs: UserNFT[] = [];

    // Process attendance-based NFTs (NFTs minted by event creator for attendees)
    if (attendanceNFTs) {
      const mappedAttendanceNFTs = attendanceNFTs.map(item => ({
        id: item.id,
        event_id: item.event_id,
        event_title: item.events?.title || 'Unknown Event',
        event_date: item.events?.date || '',
        nft_mint_address: item.nft_mint_address,
        nft_metadata_uri: item.nft_metadata_uri,
        nft_status: item.nft_status,
        nft_minted_at: item.nft_minted_at,
        checked_in_at: item.checked_in_at,
        source: 'attendance' as const,
      }));
      allNFTs.push(...mappedAttendanceNFTs);
    }

    // Process ticket-based NFTs (NFTs minted when checking in tickets)
    if (ticketNFTs) {
      const mappedTicketNFTs = ticketNFTs.map(item => {
        let metadataUri = null;
        
        // Safe type checking for metadata
        if (item.metadata && typeof item.metadata === 'object' && item.metadata !== null) {
          const metadata = item.metadata as Record<string, any>;
          metadataUri = metadata.metadataUri || null;
        }

        return {
          id: item.id,
          event_id: item.event_id,
          event_title: item.events?.title || 'Unknown Event',
          event_date: item.events?.date || '',
          nft_mint_address: item.mint_address,
          nft_metadata_uri: metadataUri,
          nft_status: 'minted', // Tickets with mint_address are considered minted
          nft_minted_at: item.checked_in_at, // Use check-in time as mint time for tickets
          checked_in_at: item.checked_in_at,
          source: 'ticket' as const,
        };
      });
      allNFTs.push(...mappedTicketNFTs);
    }

    // Remove duplicates based on event_id and source, prioritizing attendance NFTs over ticket NFTs
    const uniqueNFTs = allNFTs.reduce((acc: UserNFT[], current) => {
      const existingIndex = acc.findIndex(nft => 
        nft.event_id === current.event_id
      );
      
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // If we have both attendance and ticket NFT for same event, prefer attendance
        if (current.source === 'attendance' && acc[existingIndex].source === 'ticket') {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, []).sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());

    console.log(`Found ${uniqueNFTs.length} NFTs for user ${user.id}:`, uniqueNFTs);
    return uniqueNFTs;
  };

  return useQuery({
    queryKey: ['userNFTs', user?.id],
    queryFn: fetchUserNFTs,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
