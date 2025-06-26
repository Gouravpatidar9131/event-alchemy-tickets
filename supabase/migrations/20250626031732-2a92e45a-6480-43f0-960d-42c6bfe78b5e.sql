
-- First, clear all existing data from dependent tables
DELETE FROM public.attendance;
DELETE FROM public.tickets;
DELETE FROM public.profiles;

-- Drop the foreign key constraints that depend on the profiles table
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS fk_tickets_owner_profiles;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_attendee_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_checked_in_by_fkey;

-- Drop existing foreign key constraints on profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop the existing primary key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Drop the id column if it exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id;

-- Add id column as primary key that will reference auth.users
ALTER TABLE public.profiles 
ADD COLUMN id UUID PRIMARY KEY;

-- Add foreign key reference to auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recreate the foreign key constraints to reference the new id field
ALTER TABLE public.tickets 
ADD CONSTRAINT fk_tickets_owner_profiles 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id);

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_attendee_id_fkey 
FOREIGN KEY (attendee_id) REFERENCES public.profiles(id);

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_checked_in_by_fkey 
FOREIGN KEY (checked_in_by) REFERENCES public.profiles(id);
