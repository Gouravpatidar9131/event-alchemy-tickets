
-- Create a storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to event images
CREATE POLICY "Allow public read access to event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Create policy to allow users to update their own event images
CREATE POLICY "Allow users to update their own event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow users to delete their own event images
CREATE POLICY "Allow users to delete their own event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);
