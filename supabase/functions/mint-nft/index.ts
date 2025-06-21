
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MintRequest {
  attendanceId: string;
  metadataUri: string;
  metadata: any;
  attendeeId: string;
  eventId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { attendanceId, metadataUri, metadata, attendeeId, eventId }: MintRequest = await req.json()

    console.log('Minting NFT for attendance:', attendanceId)

    // Get user's wallet addresses from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address, monad_wallet_address')
      .eq('id', attendeeId)
      .single()

    if (!profile || (!profile.wallet_address && !profile.monad_wallet_address)) {
      throw new Error('No wallet address found for user')
    }

    // For demo purposes, we'll simulate minting on different chains
    // In production, you'd integrate with actual blockchain networks
    
    let mintAddress: string
    let transactionHash: string
    let chain: string

    // Determine which wallet to use and which chain to mint on
    if (profile.wallet_address) {
      // Ethereum/Polygon address detected
      chain = 'ethereum'
      mintAddress = generateMockMintAddress('ethereum')
      transactionHash = generateMockTransactionHash()
      
      console.log('Minting on Ethereum for wallet:', profile.wallet_address)
      
      // In production, you'd use libraries like:
      // - ethers.js or web3.js for Ethereum
      // - @metaplex-foundation/js for Solana
      // - Thirdweb SDK for multi-chain support
      
    } else if (profile.monad_wallet_address) {
      // Solana address detected
      chain = 'solana'
      mintAddress = generateMockMintAddress('solana')
      transactionHash = generateMockTransactionHash()
      
      console.log('Minting on Solana for wallet:', profile.monad_wallet_address)
    } else {
      throw new Error('No compatible wallet found')
    }

    // Simulate minting delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('NFT minted successfully:', {
      mintAddress,
      transactionHash,
      chain,
      metadataUri
    })

    return new Response(
      JSON.stringify({
        success: true,
        mintAddress,
        transactionHash,
        chain,
        metadataUri,
        openSeaUrl: getOpenSeaUrl(mintAddress, chain)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('NFT minting error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function generateMockMintAddress(chain: string): string {
  if (chain === 'solana') {
    // Generate a mock Solana address (base58)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let result = ''
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  } else {
    // Generate a mock Ethereum address
    return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
}

function generateMockTransactionHash(): string {
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function getOpenSeaUrl(mintAddress: string, chain: string): string {
  switch (chain) {
    case 'ethereum':
      return `https://opensea.io/assets/ethereum/${mintAddress}`
    case 'polygon':
      return `https://opensea.io/assets/matic/${mintAddress}`
    case 'solana':
      return `https://opensea.io/assets/solana/${mintAddress}`
    default:
      return `https://opensea.io/assets/${mintAddress}`
  }
}
