
-- Enable real-time updates for the events table
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- Add the events table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Enable real-time updates for the tickets table  
ALTER TABLE public.tickets REPLICA IDENTITY FULL;

-- Add the tickets table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
