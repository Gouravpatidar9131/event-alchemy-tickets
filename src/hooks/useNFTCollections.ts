
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface NFTCollection {
  id: string;
  event_id: string;
  collection_name: string;
  collection_symbol: string;
  collection_description: string | null;
  base_metadata_uri: string | null;
  opensea_collection_slug: string | null;
  contract_address_ethereum: string | null;
  contract_address_polygon: string | null;
  contract_address_base: string | null;
  created_at: string;
  updated_at: string;
}

export const useNFTCollections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useEventNFTCollectionQuery = (eventId: string) => useQuery({
    queryKey: ['nft-collection', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nft_collections')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is ok
        throw new Error(error.message);
      }
      return data as NFTCollection | null;
    },
    enabled: !!eventId,
  });

  const createNFTCollectionMutation = useMutation({
    mutationFn: async (collectionData: Partial<NFTCollection>) => {
      const { data, error } = await supabase
        .from('nft_collections')
        .insert(collectionData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as NFTCollection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nft-collection'] });
      toast({
        title: 'NFT Collection Created',
        description: 'Your NFT collection has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Collection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateNFTCollectionMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<NFTCollection> & { id: string }) => {
      const { data, error } = await supabase
        .from('nft_collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as NFTCollection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nft-collection'] });
      toast({
        title: 'Collection Updated',
        description: 'NFT collection has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Updating Collection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const mintAttendanceNFTMutation = useMutation({
    mutationFn: async ({ attendanceId, chain = 'base' }: { attendanceId: string; chain?: string }) => {
      const { data, error } = await supabase.functions.invoke('mint-attendance-nft', {
        body: { attendanceId, chain }
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: 'NFT Minted Successfully!',
        description: `Your attendance NFT has been minted. View on OpenSea: ${data.opensea_url}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'NFT Minting Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    useEventNFTCollectionQuery,
    createNFTCollectionMutation,
    updateNFTCollectionMutation,
    mintAttendanceNFTMutation,
  };
};
