-- Drop existing insecure storage policies
DROP POLICY IF EXISTS "Authenticated users can upload music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete music" ON storage.objects;

-- Keep public read access (already secure)
-- Policy "Anyone can view music files" is fine as-is

-- Create admin-only policies for write operations
CREATE POLICY "Only admins can upload music"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update music"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music' 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'music' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete music"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'music' 
  AND public.has_role(auth.uid(), 'admin')
);