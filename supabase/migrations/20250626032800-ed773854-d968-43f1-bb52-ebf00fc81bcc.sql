
-- Make event_id nullable in the profiles table since user profiles should be independent of events
ALTER TABLE public.profiles ALTER COLUMN event_id DROP NOT NULL;
