-- Harden storage policies for the music bucket:
-- - Public can only download files that belong to visible tracks.
-- - Only admins can upload/update/delete.
-- - Admins can download hidden/unlisted files (for moderation / QA).

-- Drop overly permissive policies from the initial schema
DROP POLICY IF EXISTS "Anyone can view music files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete music" ON storage.objects;

-- Public read: only files that map to a visible track row.
CREATE POLICY "Anyone can view visible music files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'music'
  AND EXISTS (
    SELECT 1
    FROM public.tracks t
    WHERE t.file_path = name
      AND t.is_visible = true
  )
);

-- Admin read: allow admins to access all music files, even if hidden.
CREATE POLICY "Admins can view all music files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'music'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admin write: only admins can upload/update/delete.
CREATE POLICY "Admins can upload music"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update music"
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

CREATE POLICY "Admins can delete music"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'music'
  AND public.has_role(auth.uid(), 'admin')
);

