
-- Add image_url column to messages table
ALTER TABLE public.messages ADD COLUMN image_url text;

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload chat images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

-- Allow public read
CREATE POLICY "Public can read chat images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'chat-images');
