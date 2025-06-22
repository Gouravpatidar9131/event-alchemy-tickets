
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { attendanceId, chain = 'base' } = await req.json();

    console.log(`Starting NFT mint for attendance ${attendanceId} on ${chain}`);

    // Get attendance record with event and attendee details
    const { data: attendance, error: attendanceError } = await supabaseClient
      .from('attendance')
      .select(`
        *,
        events!attendance_event_id_fkey (
          id,
          title,
          description,
          date,
          location,
          image_url,
          nft_enabled,
          nft_collection_name,
          nft_artwork_url
        ),
        profiles!attendance_attendee_id_fkey (
          display_name
        )
      `)
      .eq('id', attendanceId)
      .single();

    if (attendanceError || !attendance) {
      throw new Error(`Attendance record not found: ${attendanceError?.message}`);
    }

    if (!attendance.events.nft_enabled) {
      throw new Error('NFT minting is not enabled for this event');
    }

    if (attendance.nft_status === 'minted') {
      return new Response(
        JSON.stringify({ message: 'NFT already minted', nft_mint_address: attendance.nft_mint_address }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate NFT metadata
    const metadata: NFTMetadata = {
      name: `${attendance.events.title} - Attendance NFT`,
      description: `Commemorative NFT for attending ${attendance.events.title} on ${new Date(attendance.events.date).toLocaleDateString()}. This NFT serves as proof of attendance and grants access to exclusive holder benefits.`,
      image: attendance.events.nft_artwork_url || attendance.events.image_url || '',
      attributes: [
        {
          trait_type: 'Event',
          value: attendance.events.title
        },
        {
          trait_type: 'Date',
          value: new Date(attendance.events.date).toISOString().split('T')[0]
        },
        {
          trait_type: 'Location',
          value: attendance.events.location
        },
        {
          trait_type: 'Check-in Time',
          value: new Date(attendance.checked_in_at).toLocaleString()
        },
        {
          trait_type: 'Chain',
          value: chain.charAt(0).toUpperCase() + chain.slice(1)
        }
      ],
      external_url: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/events/${attendance.event_id}`
    };

    if (attendance.check_in_location) {
      metadata.attributes.push({
        trait_type: 'Check-in Location',
        value: attendance.check_in_location
      });
    }

    // Store metadata on IPFS (simulated - in production, use actual IPFS service)
    const metadataUri = await uploadToIPFS(metadata);

    // Get or create NFT collection for this event
    let { data: collection } = await supabaseClient
      .from('nft_collections')
      .select('*')
      .eq('event_id', attendance.event_id)
      .single();

    if (!collection) {
      const { data: newCollection, error: collectionError } = await supabaseClient
        .from('nft_collections')
        .insert({
          event_id: attendance.event_id,
          collection_name: attendance.events.nft_collection_name || `${attendance.events.title} Attendees`,
          collection_symbol: 'ATTEND',
          collection_description: `Official attendance NFTs for ${attendance.events.title}`,
          base_metadata_uri: metadataUri.split('/').slice(0, -1).join('/') + '/'
        })
        .select()
        .single();

      if (collectionError) {
        throw new Error(`Failed to create collection: ${collectionError.message}`);
      }
      collection = newCollection;
    }

    // Simulate NFT minting (in production, integrate with actual blockchain APIs)
    const mintAddress = generateMockMintAddress(chain);
    
    // Update attendance record with minting info
    const { error: updateError } = await supabaseClient
      .from('attendance')
      .update({
        nft_status: 'minted',
        nft_minted_at: new Date().toISOString(),
        nft_mint_address: mintAddress,
        nft_metadata_uri: metadataUri
      })
      .eq('id', attendanceId);

    if (updateError) {
      throw new Error(`Failed to update attendance: ${updateError.message}`);
    }

    console.log(`NFT minted successfully: ${mintAddress}`);

    return new Response(
      JSON.stringify({
        success: true,
        mint_address: mintAddress,
        metadata_uri: metadataUri,
        collection: collection,
        opensea_url: generateOpenSeaUrl(chain, mintAddress)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('NFT minting error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function uploadToIPFS(metadata: NFTMetadata): Promise<string> {
  // In production, integrate with IPFS service like Pinata or Infura
  // For now, return a mock IPFS hash
  const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  return `ipfs://${mockHash}`;
}

function generateMockMintAddress(chain: string): string {
  const prefixes = {
    ethereum: '0x',
    polygon: '0x',
    base: '0x',
    solana: ''
  };
  
  const prefix = prefixes[chain as keyof typeof prefixes] || '0x';
  const suffix = chain === 'solana' 
    ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    : Math.random().toString(16).substring(2, 15) + Math.random().toString(16).substring(2, 15);
  
  return prefix + suffix;
}

function generateOpenSeaUrl(chain: string, mintAddress: string): string {
  const chainMappings = {
    ethereum: 'ethereum',
    polygon: 'matic',
    base: 'base'
  };
  
  const chainSlug = chainMappings[chain as keyof typeof chainMappings] || 'ethereum';
  return `https://opensea.io/assets/${chainSlug}/${mintAddress}`;
}
