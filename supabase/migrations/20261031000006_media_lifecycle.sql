-- Media can be shared by duplicated cards, so deleting a card must not cascade-delete its media.
alter table public.card_media drop constraint card_media_card_id_fkey;
alter table public.card_media add constraint card_media_card_id_fkey foreign key (card_id) references public.cards (id) on delete set null;

-- True when any card (of the media owner) still references the media item.
create or replace function app_private.media_is_referenced(p_media public.card_media) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cards c
    where (c.owner_id = p_media.owner_id or c.id = p_media.card_id)
      and p_media.id = any (app_private.card_media_ids(c.card_data))
  );
$$;

-- Unreferenced media for the cleanup job: abandoned uploads (still pending after a day) and
-- media no card has referenced for 30 days.
create or replace function public.abandoned_media(p_older_than_hours int default 24, p_limit int default 200)
returns table (id uuid, storage_path text, thumbnail_path text)
language sql stable security definer set search_path = '' as $$
  select cm.id, cm.storage_path, cm.thumbnail_path from public.card_media cm
  where (cm.status = 'pending' and cm.created_at < now() - make_interval(hours => p_older_than_hours))
     or (cm.created_at < now() - interval '30 days' and not app_private.media_is_referenced(cm))
  limit least(p_limit, 1000);
$$;
revoke execute on function public.abandoned_media(int, int) from public, anon, authenticated;
grant execute on function public.abandoned_media(int, int) to service_role;

-- Owners can ask which of their media are no longer used by any card.
create or replace function public.my_unreferenced_media(p_ids uuid[]) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select cm.id from public.card_media cm
  where cm.id = any (p_ids) and cm.owner_id = auth.uid() and not app_private.media_is_referenced(cm);
$$;
revoke execute on function public.my_unreferenced_media(uuid[]) from public, anon;
grant execute on function public.my_unreferenced_media(uuid[]) to authenticated;
