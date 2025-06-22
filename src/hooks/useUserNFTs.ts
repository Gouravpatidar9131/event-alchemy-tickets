
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
}

export const useUserNFTs = () => {
  const { user } = useAuth();

  const fetchUserNFTs = async (): Promise<UserNFT[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        event_id,
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

    if (error) {
      console.error('Error fetching user NFTs:', error);
      throw new Error(error.message);
    }

    return data.map(item => ({
      id: item.id,
      event_id: item.event_id,
      event_title: item.events?.title || 'Unknown Event',
      event_date: item.events?.date || '',
      nft_mint_address: item.nft_mint_address,
      nft_metadata_uri: item.nft_metadata_uri,
      nft_status: item.nft_status,
      nft_minted_at: item.nft_minted_at,
      checked_in_at: item.checked_in_at,
    })) as UserNFT[];
  };

  return useQuery({
    queryKey: ['userNFTs', user?.id],
    queryFn: fetchUserNFTs,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
