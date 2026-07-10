DROP POLICY IF EXISTS "Admins upload remarketing media" ON storage.objects;
CREATE POLICY "Admins upload remarketing media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'remarketing-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update remarketing media" ON storage.objects;
CREATE POLICY "Admins update remarketing media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'remarketing-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete remarketing media" ON storage.objects;
CREATE POLICY "Admins delete remarketing media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'remarketing-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read remarketing media" ON storage.objects;
CREATE POLICY "Admins read remarketing media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'remarketing-media' AND public.has_role(auth.uid(), 'admin'));