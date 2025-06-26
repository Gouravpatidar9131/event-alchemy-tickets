
import { supabase } from '@/integrations/supabase/client';

export const uploadEventImage = async (file: File): Promise<string> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    console.log('Uploading image to Supabase storage:', filePath);

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('Error in uploadEventImage:', error);
    throw error;
  }
};

export const deleteEventImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get 'events/filename.ext'

    console.log('Deleting image from Supabase storage:', filePath);

    const { error } = await supabase.storage
      .from('event-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    console.log('Image deleted successfully');
  } catch (error: any) {
    console.error('Error in deleteEventImage:', error);
    throw error;
  }
};
