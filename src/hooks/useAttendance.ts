
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeData, validateQRCodeData } from '@/utils/qrCodeGenerator';

export interface AttendanceRecord {
  id: string;
  ticket_id: string;
  event_id: string;
  attendee_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
  qr_code_data: any;
  check_in_location: string | null;
  device_info: any;
  created_at: string;
  attendee_name?: string;
  nft_minted_at?: string | null;
  nft_status?: string | null;
  nft_mint_address?: string | null;
  nft_metadata_uri?: string | null;
}

export const useAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchEventAttendance = useCallback(async (eventId: string) => {
    console.log(`Fetching attendance for event: ${eventId}`);
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        tickets (
          id,
          metadata
        ),
        profiles!attendance_attendee_id_fkey (
          display_name
        )
      `)
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      throw new Error(error.message);
    }
    console.log('Attendance fetched successfully:', data);
    return data as unknown as AttendanceRecord[];
  }, []);

  const checkInAttendee = async (qrData: QRCodeData, location?: string) => {
    if (!user) throw new Error('You must be logged in to check in attendees');
    
    try {
      console.log('Processing check-in with QR data:', qrData);
      
      // Validate QR code data
      if (!validateQRCodeData(qrData)) {
        throw new Error('Invalid QR code - data may have been tampered with');
      }

      // Check if ticket exists and is valid
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, events!tickets_event_id_fkey(*)')
        .eq('id', qrData.ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Ticket not found or invalid');
      }

      // Verify event matches
      if (ticket.event_id !== qrData.eventId) {
        throw new Error('QR code is not valid for this event');
      }

      // Check if already checked in
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('ticket_id', qrData.ticketId)
        .eq('event_id', qrData.eventId)
        .single();

      if (existingAttendance) {
        throw new Error('This ticket has already been checked in');
      }

      // Get attendee profile to extract name
      const { data: attendeeProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', qrData.attendeeId)
        .single();

      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Create attendance record - the trigger will set nft_status to 'pending'
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          ticket_id: qrData.ticketId,
          event_id: qrData.eventId,
          attendee_id: qrData.attendeeId,
          checked_in_by: user.id,
          qr_code_data: qrData as any,
          check_in_location: location,
          device_info: deviceInfo
        })
        .select()
        .single();

      if (attendanceError) {
        console.error('Error creating attendance record:', attendanceError);
        throw new Error('Failed to record attendance');
      }

      // Update ticket status
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          checked_in_at: new Date().toISOString(),
          status: 'used'
        })
        .eq('id', qrData.ticketId);

      if (updateError) {
        console.error('Error updating ticket status:', updateError);
        // Don't throw here as attendance was recorded successfully
      }

      console.log('Check-in successful:', attendance);
      
      // Add attendee name to the response
      const attendanceWithName = {
        ...attendance,
        attendee_name: attendeeProfile?.display_name || qrData.attendeeName || 'Unknown'
      };

      // If NFT is enabled for the event, automatically trigger minting
      if (ticket.events?.nft_enabled) {
        try {
          await supabase.functions.invoke('mint-attendance-nft', {
            body: { 
              attendanceId: attendance.id,
              chain: 'base' // Default to Base chain
            }
          });
        } catch (nftError) {
          console.error('NFT minting error:', nftError);
          // Don't fail the check-in if NFT minting fails
        }
      }

      return attendanceWithName as unknown as AttendanceRecord;
    } catch (error: any) {
      console.error('Error checking in attendee:', error);
      throw error;
    }
  };

  const useEventAttendanceQuery = (eventId: string) => useQuery({
    queryKey: ['attendance', eventId],
    queryFn: () => fetchEventAttendance(eventId),
    enabled: !!eventId,
  });

  const checkInMutation = useMutation({
    mutationFn: ({ qrData, location }: { qrData: QRCodeData; location?: string }) =>
      checkInAttendee(qrData, location),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['eventTickets'] });
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
      toast({
        title: 'Check-in Successful',
        description: `${data.attendee_name} has been successfully checked in${data.nft_status === 'pending' ? '. NFT minting initiated!' : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Check-in Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    useEventAttendanceQuery,
    checkInMutation,
  };
};
