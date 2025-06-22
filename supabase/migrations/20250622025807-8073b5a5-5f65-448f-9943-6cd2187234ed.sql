
-- Add NFT-related columns to attendance table if they don't exist
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS nft_minted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nft_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS nft_mint_address TEXT,
ADD COLUMN IF NOT EXISTS nft_metadata_uri TEXT;

-- Create an NFT collections table to track different event collections
CREATE TABLE IF NOT EXISTS public.nft_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  collection_name TEXT NOT NULL,
  collection_symbol TEXT NOT NULL,
  collection_description TEXT,
  base_metadata_uri TEXT,
  opensea_collection_slug TEXT,
  contract_address_ethereum TEXT,
  contract_address_polygon TEXT,
  contract_address_base TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for NFT collections
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event creators can manage their NFT collections" 
  ON public.nft_collections 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = nft_collections.event_id 
      AND events.creator_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view NFT collections for public events" 
  ON public.nft_collections 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = nft_collections.event_id 
      AND events.is_published = true
    )
  );

-- Create function to automatically trigger NFT minting when attendance is recorded
CREATE OR REPLACE FUNCTION public.trigger_nft_mint()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new attendance records
  IF TG_OP = 'INSERT' THEN
    -- Update the NFT status to 'pending' for minting
    NEW.nft_status := 'pending';
    
    -- Note: The actual minting will be handled by the edge function
    -- This trigger just marks the record as ready for minting
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically initiate NFT minting on attendance
DROP TRIGGER IF EXISTS attendance_nft_mint_trigger ON public.attendance;
CREATE TRIGGER attendance_nft_mint_trigger
  BEFORE INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_nft_mint();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_nft_status ON public.attendance (nft_status);
CREATE INDEX IF NOT EXISTS idx_nft_collections_event_id ON public.nft_collections (event_id);

-- Enable real-time updates for NFT collections
ALTER TABLE public.nft_collections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nft_collections;
