/*
  # Allow Public Video Uploads

  1. Changes
    - Add policy to allow anyone (including anon users) to upload to videos bucket
    - This allows uploads through the Supabase Dashboard without authentication
  
  2. Security
    - Only applies to the 'videos' bucket
    - Read access remains public
*/

-- Drop the old authenticated-only upload policy
DROP POLICY IF EXISTS "Authenticated Users Can Upload Videos" ON storage.objects;

-- Allow anyone to upload videos (including anon)
CREATE POLICY "Anyone Can Upload Videos"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'videos');
