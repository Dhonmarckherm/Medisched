-- Add attachment support to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Add attachment support to certificates
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Note: Create a Supabase Storage bucket named 'attachments' manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new public bucket named 'attachments'
-- 3. Set the following policies:
--    - Users can upload their own files (auth check)
--    - Anyone can view files (public bucket)
--    - Users can delete their own files
