-- Private media bucket. Nothing is public by default; access is granted per path by policy
-- and delivered through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-media', 'card-media', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg', 'audio/wav']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

grant execute on function app_private.storage_card_id(text) to anon, authenticated;
grant execute on function app_private.storage_is_public(text) to anon, authenticated;
grant execute on function app_private.storage_accepts_contribution(text) to anon, authenticated;
grant execute on function app_private.storage_accepts_response(text) to anon, authenticated;
grant execute on function app_private.storage_owner_can_read(text) to authenticated;

-- Owners upload into users/{their id}/{card id}/...
create policy "media: owners upload" on storage.objects for insert to authenticated
with check (
  bucket_id = 'card-media'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (select public.is_active_user())
);

-- Contributors (no account) upload into contributions/{card id}/... while the card is open.
create policy "media: contributors upload" on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'card-media'
  and app_private.storage_accepts_contribution(name)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm')
);

-- Recipients upload a response photo when the owner allows it.
create policy "media: recipients upload responses" on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'card-media'
  and app_private.storage_accepts_response(name)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

create policy "media: owners read" on storage.objects for select to authenticated
using (
  bucket_id = 'card-media'
  and (
    ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
    or app_private.storage_owner_can_read(name)
    or (select public.is_admin())
  )
);

-- Media of published, unlocked cards can be signed for anyone (still via expiring URLs).
create policy "media: public cards read" on storage.objects for select to anon, authenticated
using (bucket_id = 'card-media' and app_private.storage_is_public(name));

create policy "media: owners update" on storage.objects for update to authenticated
using (bucket_id = 'card-media' and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy "media: owners delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'card-media'
  and (
    ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
    or app_private.storage_owner_can_read(name)
  )
);
