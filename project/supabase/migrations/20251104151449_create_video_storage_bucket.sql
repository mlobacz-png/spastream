/*
  # Create Video Storage Bucket

  1. Storage
    - Creates a public storage bucket named 'videos'
    - Allows public read access to videos
    - Restricts upload to authenticated users only

  2. Security
    - Public bucket allows anyone to view videos (for landing page)
    - Only authenticated users can upload videos
*/

-- Create the videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Access to Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Upload Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Update Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Delete Videos" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow public access to view videos
CREATE POLICY "Public Access to Videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated Users Can Upload Videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated Users Can Update Videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos');

-- Allow authenticated users to delete videos
CREATE POLICY "Authenticated Users Can Delete Videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');