
-- Add NFT-related columns to the attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS nft_mint_address TEXT,
ADD COLUMN IF NOT EXISTS nft_metadata_uri TEXT,
ADD COLUMN IF NOT EXISTS nft_minted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nft_status TEXT DEFAULT 'pending';

-- Create an index for NFT lookups
CREATE INDEX IF NOT EXISTS idx_attendance_nft_mint ON public.attendance (nft_mint_address);
CREATE INDEX IF NOT EXISTS idx_attendance_nft_status ON public.attendance (nft_status);

-- Add NFT configuration to events table for organizers to customize NFT settings
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS nft_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS nft_artwork_url TEXT,
ADD COLUMN IF NOT EXISTS nft_collection_name TEXT,
ADD COLUMN IF NOT EXISTS nft_description_template TEXT;
