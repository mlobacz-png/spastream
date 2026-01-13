/*
  # Add Client Photos Feature

  1. New Tables
    - `client_photos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients)
      - `storage_path` (text) - Path in Supabase Storage
      - `photo_type` (text) - Type: before, after, treatment, consultation
      - `caption` (text) - Optional description
      - `taken_at` (timestamptz) - When photo was taken
      - `created_at` (timestamptz)

  2. Storage
    - Create storage bucket 'client-photos'
    - Enable RLS policies for secure access

  3. Security
    - Enable RLS on `client_photos` table
    - Add policies for users to manage their own client photos
*/

-- Create client_photos table
CREATE TABLE IF NOT EXISTS client_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after', 'treatment', 'consultation', 'other')),
  caption text DEFAULT '',
  taken_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_photos
CREATE POLICY "Users can view own client photos"
  ON client_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client photos"
  ON client_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client photos"
  ON client_photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client photos"
  ON client_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket (via SQL - this creates the bucket definition)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-photos bucket
CREATE POLICY "Users can upload their own client photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own client photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own client photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own client photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS client_photos_client_id_idx ON client_photos(client_id);
CREATE INDEX IF NOT EXISTS client_photos_user_id_idx ON client_photos(user_id);
CREATE INDEX IF NOT EXISTS client_photos_photo_type_idx ON client_photos(photo_type);