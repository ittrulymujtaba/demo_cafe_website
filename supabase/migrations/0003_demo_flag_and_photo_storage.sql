-- 1. Mark demo cafés, so the site never shows a real, tappable phone number for them.
alter table cafes add column if not exists is_demo boolean not null default false;

-- 2. Photo uploads. Files live in the public "cafe-photos" bucket under "<cafe_id>/<file>".
--    Anyone can view them (the bucket is public). Only that café's admins can add or remove them.
create policy "admins upload cafe photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cafe-photos'
    and public.is_cafe_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "admins delete cafe photos" on storage.objects for delete to authenticated
  using (
    bucket_id = 'cafe-photos'
    and public.is_cafe_admin(((storage.foldername(name))[1])::uuid)
  );
