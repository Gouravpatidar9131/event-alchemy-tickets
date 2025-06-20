
-- Create an attendance table to track check-ins with more detailed information
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  attendee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  qr_code_data JSONB,
  check_in_location TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for event organizers to view attendance for their events
CREATE POLICY "Event organizers can view attendance for their events" 
  ON public.attendance 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = attendance.event_id 
      AND events.creator_id = auth.uid()
    )
  );

-- Create policy for event organizers to insert attendance records
CREATE POLICY "Event organizers can create attendance records" 
  ON public.attendance 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = attendance.event_id 
      AND events.creator_id = auth.uid()
    )
  );

-- Enable real-time updates for the attendance table
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- Update tickets table to store QR code data
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qr_code_data JSONB;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qr_code_generated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets USING GIN (qr_code_data);
CREATE INDEX IF NOT EXISTS idx_attendance_ticket_event ON public.attendance (ticket_id, event_id);
