-- Approved contribution files can be signed by anyone holding their (unguessable) path, so the
-- contributor page can show what's on the card before it is published.
create or replace function app_private.storage_contribution_visible(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_contributions g
    join public.cards c on c.id = g.card_id
    where split_part(p_name, '/', 1) = 'contributions'
      and g.card_id = app_private.storage_card_id(p_name)
      and g.status = 'approved'
      and g.media_references @> jsonb_build_array(jsonb_build_object('path', p_name))
      and c.status <> 'archived' and not c.is_disabled
  );
$$;
grant execute on function app_private.storage_contribution_visible(text) to anon, authenticated;
create policy "media: approved contributions read" on storage.objects for select to anon, authenticated
using (bucket_id = 'card-media' and app_private.storage_contribution_visible(name));

-- Demo group card: a fixed invitation so visitors can try contributing. Submissions stay pending
-- (there is no owner to approve them), so nothing posted to the demo is ever shown publicly.
update public.cards
set contribution_token = 'DemoGroupCardHappyBirthdayLeo2026', contributions_require_approval = true
where slug = 'happy-birthday-leo' and is_sample;
