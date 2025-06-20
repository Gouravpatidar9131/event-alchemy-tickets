
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow authenticated users to upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to event photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own event photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own event photos" ON storage.objects;

-- Create new policy to allow authenticated users to upload files to event-photos bucket
CREATE POLICY "authenticated_users_can_upload_event_photos" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'event-photos');

-- Create policy to allow public read access to event photos
CREATE POLICY "public_can_view_event_photos" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'event-photos');

-- Create policy to allow authenticated users to update files in event-photos bucket
CREATE POLICY "authenticated_users_can_update_event_photos" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'event-photos')
WITH CHECK (bucket_id = 'event-photos');

-- Create policy to allow authenticated users to delete files in event-photos bucket
CREATE POLICY "authenticated_users_can_delete_event_photos" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'event-photos');
