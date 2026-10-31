-- Entitlements, guards and Row Level Security.
-- Plan limits live in the database so every write path (API, direct PostgREST, RPC) enforces them.

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- ---------------------------------------------------------------- plan limits
create table public.plan_limits (
  plan public.plan_tier primary key,
  max_live_cards int not null,
  max_photos_per_card int not null,
  max_pages int not null,
  max_video_seconds int not null,
  allow_video_audio boolean not null,
  allow_premium_templates boolean not null,
  allow_remove_branding boolean not null,
  allow_scheduling boolean not null,
  max_group_contributors int not null,
  ai_generations_per_month int not null,
  storage_bytes bigint not null,
  max_image_bytes bigint not null,
  max_video_bytes bigint not null,
  max_audio_bytes bigint not null
);
-- Values are written by the seed generated from src/lib/entitlements.ts.

-- ---------------------------------------------------------------- random ids
create or replace function app_private.random_string(len int, alphabet text) returns text
language plpgsql volatile set search_path = '' as $$
declare
  bytes bytea := extensions.gen_random_bytes(len);
  out text := '';
  i int;
begin
  for i in 0 .. len - 1 loop
    out := out || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return out;
end $$;

-- 12 chars of [a-z0-9] ≈ 62 bits of entropy.
create or replace function public.new_card_slug() returns text
language sql volatile set search_path = '' as $$
  select app_private.random_string(12, 'abcdefghijklmnopqrstuvwxyz0123456789');
$$;

create or replace function app_private.new_token() returns text
language sql volatile set search_path = '' as $$
  select app_private.random_string(32, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
$$;

-- ---------------------------------------------------------------- identity helpers
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' and suspended_at is null from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select suspended_at is null from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.can_edit_card(p_card_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cards c
    where c.id = p_card_id
      and (c.owner_id = auth.uid()
        or exists (select 1 from public.card_collaborators cc where cc.card_id = c.id and cc.user_id = auth.uid() and cc.permission in ('owner', 'editor')))
  );
$$;

-- The plan that applies to a user right now (admins get Pro).
create or replace function public.plan_for(p_user uuid) returns public.plan_tier
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.profiles where id = p_user and role = 'admin') then 'pro'::public.plan_tier
    else coalesce((
      select max(s.plan) from public.subscriptions s
      where s.user_id = p_user
        and (s.status in ('active', 'trialing') or (s.status = 'past_due' and s.current_period_end > now() - interval '3 days'))
        and (s.current_period_end is null or s.current_period_end > now() - interval '3 days')
    ), 'free'::public.plan_tier)
  end;
$$;

create or replace function public.my_plan() returns public.plan_tier
language sql stable security definer set search_path = '' as $$
  select public.plan_for(auth.uid());
$$;

-- Plan for a specific card: one-time card purchases upgrade that card to Premium.
create or replace function app_private.card_plan(p_card public.cards) returns public.plan_tier
language sql stable security definer set search_path = '' as $$
  select greatest(
    public.plan_for(p_card.owner_id),
    case when exists (
      select 1 from public.purchases p
      where p.card_id = p_card.id and p.status = 'paid' and p.product_type in ('premium_card', 'special_experience')
    ) then 'premium'::public.plan_tier else 'free'::public.plan_tier end
  );
$$;

-- Media ids referenced anywhere inside card_data (elements, photos, audio, video).
create or replace function app_private.card_media_ids(p_data jsonb) returns uuid[]
language sql immutable set search_path = '' as $$
  select coalesce(array_agg(distinct m[1]::uuid), '{}')
  from regexp_matches(p_data::text, 'media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', 'g') as m;
$$;

-- Returns a human-readable reason when a live card exceeds its plan, or null when it's allowed.
create or replace function app_private.card_entitlement_violation(p_card public.cards) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_plan public.plan_tier := app_private.card_plan(p_card);
  v_limits public.plan_limits;
  v_premium_template boolean;
  v_photos int;
  v_pages int;
  v_av int;
  v_video_seconds numeric;
  v_live int;
begin
  if p_card.is_sample then return null; end if;
  select * into v_limits from public.plan_limits where plan = v_plan;
  if not found then return 'Plan limits are not configured.'; end if;

  select t.is_premium into v_premium_template from public.templates t where t.id = p_card.template_id;
  if coalesce(v_premium_template, false) and not v_limits.allow_premium_templates then
    return 'This template is part of Premium.';
  end if;
  if not p_card.show_branding and not v_limits.allow_remove_branding then
    return 'Removing Dearly branding needs Premium.';
  end if;
  if p_card.status = 'scheduled' and not v_limits.allow_scheduling then
    return 'Scheduled delivery is part of Pro.';
  end if;

  v_pages := coalesce(jsonb_array_length(p_card.card_data -> 'pages'), 0);
  if v_pages > v_limits.max_pages then
    return format('Your plan allows %s pages per card.', v_limits.max_pages);
  end if;

  select count(*) filter (where cm.media_type = 'image'),
         count(*) filter (where cm.media_type in ('video', 'audio')),
         coalesce(max(cm.duration) filter (where cm.media_type = 'video'), 0)
    into v_photos, v_av, v_video_seconds
  from public.card_media cm
  where cm.id = any (app_private.card_media_ids(p_card.card_data));

  if v_photos > v_limits.max_photos_per_card then
    return format('Your plan allows %s photos per card.', v_limits.max_photos_per_card);
  end if;
  if v_av > 0 and not v_limits.allow_video_audio then
    return 'Video and audio are part of Premium.';
  end if;
  if v_video_seconds > v_limits.max_video_seconds then
    return format('Videos can be up to %s seconds on your plan.', v_limits.max_video_seconds);
  end if;

  select count(*) into v_live from public.cards c
  where c.owner_id = p_card.owner_id and c.status in ('published', 'scheduled') and c.id <> p_card.id;
  if v_live + 1 > v_limits.max_live_cards then
    return format('Your plan allows %s live cards at a time. Archive one to publish another.', v_limits.max_live_cards);
  end if;
  return null;
end $$;

-- Every referenced media item must belong to the card's owner (or the card) and be uploaded.
create or replace function app_private.card_media_problem(p_card public.cards) returns text
language sql stable security definer set search_path = '' as $$
  select case when exists (
    select 1 from unnest(app_private.card_media_ids(p_card.card_data)) as ref(id)
    left join public.card_media cm on cm.id = ref.id
    where cm.id is null or cm.status <> 'ready' or (cm.owner_id is distinct from p_card.owner_id and cm.card_id is distinct from p_card.id)
  ) then 'Some photos, videos or audio are missing or still uploading.' end;
$$;

-- ---------------------------------------------------------------- card guard
-- Fields only the server-side publishing functions (or admins) may change.
-- A caller is "trusted" when it isn't a client JWT (migrations, service role) or a publishing RPC set dearly.trusted.
create or replace function app_private.is_trusted_caller() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(auth.role(), '') not in ('authenticated', 'anon')
      or coalesce(current_setting('dearly.trusted', true), '') = 'on';
$$;

create or replace function app_private.guard_card_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_trusted boolean := app_private.is_trusted_caller();
  v_admin boolean := public.is_admin();
  v_problem text;
begin

  if tg_op = 'INSERT' then
    if not v_trusted then
      if new.is_sample or new.owner_id is distinct from auth.uid() then
        raise exception 'You can only create cards for yourself.' using errcode = '42501';
      end if;
      new.status := 'draft';
      new.published_at := null;
      new.scheduled_at := null;
      new.view_count := 0;
      new.last_opened_at := null;
      new.password_hash := null;
      new.show_branding := true;
      new.version := 1;
      new.slug := public.new_card_slug();
    end if;
    return new;
  end if;

  -- UPDATE
  if not v_trusted then
    if new.owner_id is distinct from old.owner_id or new.is_sample is distinct from old.is_sample
       or new.view_count is distinct from old.view_count or new.last_opened_at is distinct from old.last_opened_at
       or new.slug is distinct from old.slug or new.password_hash is distinct from old.password_hash
       or new.contribution_token is distinct from old.contribution_token then
      raise exception 'That field can''t be changed directly.' using errcode = '42501';
    end if;
    if not v_admin and (new.disabled_reason is distinct from old.disabled_reason) then
      raise exception 'Only moderators can change moderation fields.' using errcode = '42501';
    end if;
    if not v_admin and old.disabled_reason is not null and not new.is_disabled then
      raise exception 'This card was disabled by our moderators. Contact support to appeal.' using errcode = '42501';
    end if;
    -- Publishing must go through publish_card(); unpublishing/archiving is allowed.
    if new.status in ('published', 'scheduled') and old.status not in ('published', 'scheduled') then
      raise exception 'Use publish_card() to publish.' using errcode = '42501';
    end if;
    if new.scheduled_at is distinct from old.scheduled_at or new.published_at is distinct from old.published_at then
      if new.status in ('published', 'scheduled') then
        raise exception 'Use publish_card() to change delivery.' using errcode = '42501';
      end if;
    end if;
    if new.status not in ('published', 'scheduled') then
      new.published_at := case when new.status = 'archived' then old.published_at else null end;
      new.scheduled_at := null;
    end if;
  end if;

  if new.card_data is distinct from old.card_data then
    new.version := old.version + 1;
  end if;

  -- Live cards must satisfy their plan and reference valid media whenever their content or status changes
  -- (bookkeeping updates such as view counts are not re-checked).
  if new.status in ('published', 'scheduled') and not v_admin
     and (old.status not in ('published', 'scheduled') or new.card_data is distinct from old.card_data
          or new.show_branding is distinct from old.show_branding or new.template_id is distinct from old.template_id) then
    v_problem := coalesce(app_private.card_entitlement_violation(new), app_private.card_media_problem(new));
    if v_problem is not null then
      raise exception '%', v_problem using errcode = 'P0001', hint = 'entitlement';
    end if;
  end if;
  return new;
end $$;
create trigger cards_guard before insert or update on public.cards for each row execute function app_private.guard_card_write();

-- Users can't promote themselves or lift their own suspension.
create or replace function app_private.guard_profile_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app_private.is_trusted_caller() or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role or new.suspended_at is distinct from old.suspended_at or new.suspension_reason is distinct from old.suspension_reason then
    raise exception 'That field can''t be changed.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function app_private.guard_profile_write();

-- Upload limits per type, plan and storage quota.
create or replace function app_private.guard_media_insert() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_limits public.plan_limits;
  v_used bigint;
begin
  if app_private.is_trusted_caller() then return new; end if;
  if new.owner_id is distinct from auth.uid() then
    raise exception 'You can only upload your own media.' using errcode = '42501';
  end if;
  if not public.is_active_user() then
    raise exception 'Your account is suspended.' using errcode = '42501';
  end if;
  if new.card_id is not null and not public.can_edit_card(new.card_id) then
    raise exception 'You can''t add media to that card.' using errcode = '42501';
  end if;
  if new.storage_path not like 'users/' || auth.uid()::text || '/%' then
    raise exception 'Invalid storage path.' using errcode = '42501';
  end if;
  select * into v_limits from public.plan_limits where plan = public.my_plan();
  if new.media_type = 'image' and new.file_size > v_limits.max_image_bytes then
    raise exception 'Images can be up to % MB.', v_limits.max_image_bytes / 1048576 using errcode = 'P0001';
  elsif new.media_type = 'video' and new.file_size > v_limits.max_video_bytes then
    raise exception 'Videos can be up to % MB.', v_limits.max_video_bytes / 1048576 using errcode = 'P0001';
  elsif new.media_type = 'audio' and new.file_size > v_limits.max_audio_bytes then
    raise exception 'Audio can be up to % MB.', v_limits.max_audio_bytes / 1048576 using errcode = 'P0001';
  end if;
  if new.media_type in ('video', 'audio') and not v_limits.allow_video_audio then
    raise exception 'Video and audio are part of Premium.' using errcode = 'P0001', hint = 'entitlement';
  end if;
  select coalesce(sum(file_size), 0) into v_used from public.card_media where owner_id = auth.uid();
  if v_used + new.file_size > v_limits.storage_bytes then
    raise exception 'You''ve reached your storage limit.' using errcode = 'P0001', hint = 'entitlement';
  end if;
  new.status := 'pending';
  return new;
end $$;
create trigger card_media_guard before insert on public.card_media for each row execute function app_private.guard_media_insert();

-- ---------------------------------------------------------------- rate limiting
create or replace function app_private.hit_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;
  return v_count <= p_max;
end $$;

-- Rate limit keyed by the signed-in user (used by API routes).
create or replace function public.rate_limit_self(p_bucket text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return false; end if;
  return app_private.hit_rate_limit('u:' || auth.uid()::text || ':' || left(p_bucket, 40), least(p_max, 10000), least(p_window_seconds, 86400));
end $$;

-- Best-effort client fingerprint from proxy headers (never stored).
create or replace function app_private.client_ip() returns text
language sql stable set search_path = '' as $$
  select coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'unknown');
$$;

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.occasions enable row level security;
alter table public.templates enable row level security;
alter table public.cards enable row level security;
alter table public.card_collaborators enable row level security;
alter table public.card_media enable row level security;
alter table public.card_views enable row level security;
alter table public.card_reactions enable row level security;
alter table public.group_contributions enable row level security;
alter table public.received_cards enable row level security;
alter table public.subscriptions enable row level security;
alter table public.purchases enable row level security;
alter table public.payment_events enable row level security;
alter table public.delivery_jobs enable row level security;
alter table public.ai_generations enable row level security;
alter table public.card_reports enable row level security;
alter table public.rate_limits enable row level security;
alter table public.plan_limits enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid()) or (select public.is_admin())) with check (id = (select auth.uid()) or (select public.is_admin()));

-- catalogue: public read of live rows, admin write
create policy occasions_read on public.occasions for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy occasions_admin on public.occasions for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy templates_read on public.templates for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy templates_admin on public.templates for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy plan_limits_read on public.plan_limits for select to anon, authenticated using (true);

-- cards: owners, editors and admins. The public reads published cards only through get_public_card().
create policy cards_select on public.cards for select to authenticated using (
  owner_id = (select auth.uid()) or (select public.is_admin())
  or exists (select 1 from public.card_collaborators cc where cc.card_id = cards.id and cc.user_id = (select auth.uid()))
);
create policy cards_insert on public.cards for insert to authenticated with check (owner_id = (select auth.uid()) and (select public.is_active_user()));
create policy cards_update on public.cards for update to authenticated
  using ((select public.can_edit_card(id)) or (select public.is_admin()))
  with check (((select public.can_edit_card(id)) and (select public.is_active_user())) or (select public.is_admin()));
create policy cards_delete on public.cards for delete to authenticated using (owner_id = (select auth.uid()) or (select public.is_admin()));

-- collaborators: visible to the card owner and the collaborator; only owners manage them
create policy collaborators_select on public.card_collaborators for select to authenticated using (
  user_id = (select auth.uid()) or exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid()))
);
create policy collaborators_manage on public.card_collaborators for all to authenticated
  using (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())));

-- media: owner only (public delivery goes through signed URLs gated by storage policies)
create policy media_select on public.card_media for select to authenticated using (owner_id = (select auth.uid()) or (card_id is not null and (select public.can_edit_card(card_id))) or (select public.is_admin()));
create policy media_insert on public.card_media for insert to authenticated with check (owner_id = (select auth.uid()));
create policy media_update on public.card_media for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy media_delete on public.card_media for delete to authenticated using (owner_id = (select auth.uid()));

-- views & reactions: card owners can read; inserts only through RPCs
create policy views_owner_read on public.card_views for select to authenticated using (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())));
create policy reactions_owner_read on public.card_reactions for select to authenticated using (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())));
create policy reactions_owner_update on public.card_reactions for update to authenticated
  using (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())));

-- contributions: owners moderate; contributors submit through submit_contribution()
create policy contributions_owner_read on public.group_contributions for select to authenticated using ((select public.can_edit_card(card_id)));
create policy contributions_owner_update on public.group_contributions for update to authenticated using ((select public.can_edit_card(card_id))) with check ((select public.can_edit_card(card_id)));
create policy contributions_owner_delete on public.group_contributions for delete to authenticated using ((select public.can_edit_card(card_id)));

-- received cards: your own list only
create policy received_own on public.received_cards for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- billing: read your own; writes come from verified webhooks (service role)
create policy subscriptions_own on public.subscriptions for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy purchases_own on public.purchases for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

-- delivery: card owners can see and cancel their jobs; creation goes through publish_card()
create policy delivery_owner_read on public.delivery_jobs for select to authenticated using (exists (select 1 from public.cards c where c.id = card_id and c.owner_id = (select auth.uid())));

-- AI usage: your own history
create policy ai_own on public.ai_generations for select to authenticated using (user_id = (select auth.uid()));

-- reports: admins only (submitted through report_card())
create policy reports_admin on public.card_reports for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- payment_events and rate_limits: no client access at all (RLS on, no policies).

-- Trigger functions run as the calling role, so it needs usage on the private helpers they call.
grant usage on schema app_private to authenticated, anon;
grant execute on function app_private.is_trusted_caller() to authenticated, anon;
grant execute on function app_private.card_entitlement_violation(public.cards) to authenticated;
grant execute on function app_private.card_media_problem(public.cards) to authenticated;
grant execute on function app_private.card_plan(public.cards) to authenticated;
grant execute on function app_private.card_media_ids(jsonb) to authenticated;
grant execute on function public.new_card_slug() to authenticated;
grant execute on function app_private.random_string(int, text) to authenticated;
