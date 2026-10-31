-- Server-side business functions. Anonymous recipients and contributors only ever touch
-- cards through these SECURITY DEFINER functions, which expose the minimum data needed.

-- Avoid exposing plan details of other users.
revoke execute on function public.plan_for(uuid) from public, anon, authenticated;

create or replace function app_private.card_is_public(c public.cards) returns boolean
language sql stable set search_path = '' as $$
  select c.status in ('published', 'scheduled')
     and not c.is_disabled
     and (c.expires_at is null or c.expires_at > now())
     and (c.owner_id is null or exists (select 1 from public.profiles p where p.id = c.owner_id and p.suspended_at is null));
$$;

-- ---------------------------------------------------------------- publishing
create or replace function public.publish_card(
  p_card_id uuid,
  p_scheduled_at timestamptz default null,
  p_timezone text default null,
  p_delivery_email text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c public.cards;
  v_status public.card_status;
  v_email text := nullif(trim(p_delivery_email), '');
begin
  select * into c from public.cards where id = p_card_id for update;
  if not found or c.owner_id is distinct from auth.uid() then
    raise exception 'Card not found.' using errcode = 'P0002';
  end if;
  if not public.is_active_user() then
    raise exception 'Your account is suspended.' using errcode = '42501';
  end if;
  if c.disabled_reason is not null then
    raise exception 'This card was disabled by our moderators.' using errcode = '42501';
  end if;
  if char_length(trim(c.recipient_name)) = 0 then
    raise exception 'Add who the card is for before publishing.' using errcode = '22023';
  end if;
  if coalesce(jsonb_array_length(c.card_data -> 'pages'), 0) = 0 then
    raise exception 'Your card needs at least one page.' using errcode = '22023';
  end if;
  if p_scheduled_at is not null and (p_scheduled_at < now() + interval '1 minute' or p_scheduled_at > now() + interval '366 days') then
    raise exception 'Choose a delivery time between now and a year from now.' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'That email address doesn''t look right.' using errcode = '22023';
  end if;
  if p_timezone is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Unknown timezone.' using errcode = '22023';
  end if;

  v_status := case when p_scheduled_at is null then 'published' else 'scheduled' end;
  perform set_config('dearly.trusted', 'on', true);
  update public.cards set
    status = v_status,
    published_at = coalesce(case when c.status in ('published', 'scheduled') then c.published_at end, now()),
    scheduled_at = p_scheduled_at,
    timezone = coalesce(p_timezone, c.timezone),
    recipient_email = coalesce(v_email, c.recipient_email),
    is_disabled = false,
    contribution_token = case when c.experience_type = 'together' then coalesce(c.contribution_token, app_private.new_token()) else c.contribution_token end
  where id = c.id
  returning * into c;
  -- The guard trigger re-checks plan entitlements and media; trusted mode only unlocks status fields.
  perform set_config('dearly.trusted', 'off', true);

  update public.delivery_jobs set status = 'cancelled' where card_id = c.id and status in ('scheduled', 'sending');
  if v_email is not null or (p_scheduled_at is not null and c.recipient_email is not null) then
    insert into public.delivery_jobs (card_id, delivery_email, scheduled_at, timezone)
    values (c.id, coalesce(v_email, c.recipient_email), coalesce(p_scheduled_at, now()), coalesce(p_timezone, c.timezone, 'UTC'));
  end if;

  return jsonb_build_object('id', c.id, 'slug', c.slug, 'status', c.status, 'scheduledAt', c.scheduled_at, 'publishedAt', c.published_at, 'contributionToken', c.contribution_token);
end $$;

create or replace function public.unpublish_card(p_card_id uuid, p_archive boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.cards where id = p_card_id and owner_id = auth.uid()) then
    raise exception 'Card not found.' using errcode = 'P0002';
  end if;
  update public.cards set status = case when p_archive then 'archived'::public.card_status else 'draft'::public.card_status end where id = p_card_id;
  update public.delivery_jobs set status = 'cancelled' where card_id = p_card_id and status in ('scheduled', 'sending');
end $$;

create or replace function public.set_card_password(p_card_id uuid, p_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.cards where id = p_card_id and owner_id = auth.uid()) then
    raise exception 'Card not found.' using errcode = 'P0002';
  end if;
  if p_password is not null and char_length(p_password) not between 4 and 72 then
    raise exception 'Use 4 to 72 characters.' using errcode = '22023';
  end if;
  perform set_config('dearly.trusted', 'on', true);
  update public.cards set password_hash = case when p_password is null then null else extensions.crypt(p_password, extensions.gen_salt('bf', 10)) end where id = p_card_id;
  perform set_config('dearly.trusted', 'off', true);
end $$;

create or replace function public.regenerate_contribution_token(p_card_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_token text := app_private.new_token();
begin
  if not exists (select 1 from public.cards where id = p_card_id and owner_id = auth.uid()) then
    raise exception 'Card not found.' using errcode = 'P0002';
  end if;
  perform set_config('dearly.trusted', 'on', true);
  update public.cards set contribution_token = v_token where id = p_card_id;
  perform set_config('dearly.trusted', 'off', true);
  return v_token;
end $$;

-- ---------------------------------------------------------------- public card access
create or replace function app_private.public_contributions(p_card_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', g.id, 'name', g.contributor_name, 'message', g.message, 'color', g.color,
    'media', g.media_references, 'createdAt', g.submitted_at) order by g.submitted_at), '[]'::jsonb)
  from public.group_contributions g where g.card_id = p_card_id and g.status = 'approved';
$$;

create or replace function public.get_public_card(p_slug text, p_password text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c public.cards;
  v_template text;
  v_occasion text;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9-]{8,64}$' then return null; end if;
  select * into c from public.cards where slug = p_slug;
  if not found or not app_private.card_is_public(c) then return null; end if;

  if c.status = 'scheduled' and c.scheduled_at > now() then
    return jsonb_build_object('state', 'scheduled', 'scheduledAt', c.scheduled_at, 'senderName', c.sender_name, 'palette', c.card_data ->> 'palette');
  end if;
  if c.password_hash is not null and (p_password is null or extensions.crypt(p_password, c.password_hash) <> c.password_hash) then
    return jsonb_build_object('state', 'locked', 'senderName', c.sender_name, 'palette', c.card_data ->> 'palette', 'wrongPassword', p_password is not null);
  end if;

  select slug into v_template from public.templates where id = c.template_id;
  select slug into v_occasion from public.occasions where id = c.occasion_id;
  return jsonb_build_object(
    'state', 'open',
    'card', jsonb_build_object(
      'id', c.id, 'slug', c.slug, 'title', c.title, 'status', c.status,
      'recipientName', c.recipient_name, 'senderName', c.sender_name,
      'experienceType', c.experience_type, 'templateSlug', v_template, 'occasionSlug', v_occasion,
      'cardData', c.card_data, 'showBranding', c.show_branding, 'allowReactions', c.allow_reactions,
      'allowResponsePhoto', c.allow_response_photo, 'isSample', c.is_sample,
      'publishedAt', c.published_at, 'updatedAt', c.updated_at,
      'contributions', app_private.public_contributions(c.id)
    )
  );
end $$;

-- Minimal, non-sensitive data for link previews (Open Graph).
create or replace function public.get_card_share_meta(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'recipientName', split_part(c.recipient_name, ' ', 1),
    'senderName', split_part(c.sender_name, ' ', 1),
    'palette', c.card_data ->> 'palette',
    'templateSlug', t.slug,
    'experienceType', c.experience_type,
    'locked', c.password_hash is not null
  )
  from public.cards c left join public.templates t on t.id = c.template_id
  where c.slug = p_slug and app_private.card_is_public(c);
$$;

-- Signed-URL helper: storage paths for media referenced by a public card.
create or replace function public.get_public_media_paths(p_slug text, p_ids uuid[]) returns table (id uuid, storage_path text, thumbnail_path text, media_type public.media_type)
language sql stable security definer set search_path = '' as $$
  select cm.id, cm.storage_path, cm.thumbnail_path, cm.media_type
  from public.cards c
  join public.card_media cm on cm.id = any (p_ids) and cm.id = any (app_private.card_media_ids(c.card_data)) and cm.status = 'ready'
  where c.slug = p_slug and app_private.card_is_public(c) and c.password_hash is null
  limit 200;
$$;

create or replace function public.record_card_view(p_slug text, p_session text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  c public.cards;
  v_id uuid;
begin
  if p_session is null or char_length(p_session) not between 8 and 64 then return null; end if;
  select * into c from public.cards where slug = p_slug;
  if not found or not app_private.card_is_public(c) then return null; end if;
  if c.owner_id = auth.uid() then return null; end if; -- owners previewing don't count
  if not app_private.hit_rate_limit('view:' || p_session || ':' || c.id, 10, 3600) then return null; end if;
  -- One view per session per card per hour; reuse the existing row.
  select id into v_id from public.card_views where card_id = c.id and viewer_session_id = p_session and opened_at > now() - interval '1 hour' limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.card_views (card_id, viewer_session_id) values (c.id, p_session) returning id into v_id;
  perform set_config('dearly.trusted', 'on', true);
  update public.cards set view_count = view_count + 1, last_opened_at = now() where id = c.id;
  perform set_config('dearly.trusted', 'off', true);
  return v_id;
end $$;

create or replace function public.complete_card_view(p_view_id uuid, p_session text, p_summary jsonb) returns void
language sql security definer set search_path = '' as $$
  update public.card_views
  set completed_at = coalesce(completed_at, now()),
      interaction_summary = case when pg_column_size(p_summary) < 2000 and jsonb_typeof(p_summary) = 'object' then p_summary else '{}'::jsonb end
  where id = p_view_id and viewer_session_id = p_session;
$$;

create or replace function public.submit_reaction(p_slug text, p_session text, p_type text, p_message text default null, p_photo_path text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  c public.cards;
  v_id uuid;
begin
  select * into c from public.cards where slug = p_slug;
  if not found or not app_private.card_is_public(c) or not c.allow_reactions then
    raise exception 'Reactions are turned off for this card.' using errcode = '42501';
  end if;
  if p_session is null or char_length(p_session) not between 8 and 64 then
    raise exception 'Invalid session.' using errcode = '22023';
  end if;
  if not app_private.hit_rate_limit('react:' || p_session || ':' || c.id, 3, 3600)
     or not app_private.hit_rate_limit('react-ip:' || app_private.client_ip() || ':' || c.id, 10, 3600) then
    raise exception 'You''ve sent a few reactions already — try again later.' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  if p_photo_path is not null and (not c.allow_response_photo or p_photo_path not like 'responses/' || c.id::text || '/%') then
    raise exception 'Photo responses aren''t enabled.' using errcode = '42501';
  end if;
  insert into public.card_reactions (card_id, reaction_type, message, photo_path)
  values (c.id, p_type, nullif(left(trim(p_message), 500), ''), p_photo_path)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.mark_card_received(p_slug text, p_saved boolean default null) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.cards;
begin
  if auth.uid() is null then return; end if;
  select * into c from public.cards where slug = p_slug;
  if not found or not app_private.card_is_public(c) or c.owner_id = auth.uid() then return; end if;
  insert into public.received_cards (user_id, card_id, saved) values (auth.uid(), c.id, coalesce(p_saved, false))
  on conflict (user_id, card_id) do update set last_opened_at = now(), saved = coalesce(p_saved, public.received_cards.saved);
end $$;

create or replace function public.report_card(p_slug text, p_reason text, p_details text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.cards;
begin
  select * into c from public.cards where slug = p_slug;
  if not found then return; end if;
  if not app_private.hit_rate_limit('report-ip:' || app_private.client_ip(), 10, 3600) then
    raise exception 'Too many reports — please try again later.' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  insert into public.card_reports (card_id, reason, details) values (c.id, p_reason, nullif(left(trim(p_details), 1000), ''));
end $$;

-- ---------------------------------------------------------------- group cards
create or replace function app_private.contribution_cap(c public.cards) returns int
language sql stable security definer set search_path = '' as $$
  select least(
    coalesce(c.contribution_limit, 1000),
    case when exists (select 1 from public.purchases p where p.card_id = c.id and p.status = 'paid' and p.product_type = 'group_card')
      then 200
      else (select max_group_contributors from public.plan_limits where plan = app_private.card_plan(c))
    end
  );
$$;

create or replace function public.get_contribution_invite(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  c public.cards;
  v_count int;
  v_template text;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9]{24,64}$' then return null; end if;
  select * into c from public.cards where contribution_token = p_token and experience_type = 'together';
  if not found or c.status = 'archived' or c.is_disabled then return null; end if;
  select count(*) into v_count from public.group_contributions where card_id = c.id and status <> 'rejected';
  select slug into v_template from public.templates where id = c.template_id;
  return jsonb_build_object(
    'cardId', c.id,
    'recipientName', c.recipient_name,
    'senderName', c.sender_name,
    'title', c.title,
    'templateSlug', v_template,
    'palette', c.card_data ->> 'palette',
    'message', c.card_data ->> 'message',
    'deadline', c.contribution_deadline,
    'limit', app_private.contribution_cap(c),
    'count', v_count,
    'requiresApproval', c.contributions_require_approval,
    'isOpen', (c.contribution_deadline is null or c.contribution_deadline > now()) and v_count < app_private.contribution_cap(c),
    'contributions', app_private.public_contributions(c.id)
  );
end $$;

create or replace function public.submit_contribution(
  p_token text, p_session text, p_name text, p_message text, p_color text default '#F9D9D3', p_media jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c public.cards;
  v_count int;
  v_row public.group_contributions;
  v_item jsonb;
begin
  select * into c from public.cards where contribution_token = p_token and experience_type = 'together' for update;
  if not found or c.status = 'archived' or c.is_disabled then
    raise exception 'This invitation is no longer active.' using errcode = 'P0002';
  end if;
  if c.contribution_deadline is not null and c.contribution_deadline <= now() then
    raise exception 'The deadline for this card has passed.' using errcode = 'P0001';
  end if;
  select count(*) into v_count from public.group_contributions where card_id = c.id and status <> 'rejected';
  if v_count >= app_private.contribution_cap(c) then
    raise exception 'This card has reached its contributor limit.' using errcode = 'P0001', hint = 'entitlement';
  end if;
  if p_session is null or char_length(p_session) not between 8 and 64 then
    raise exception 'Invalid session.' using errcode = '22023';
  end if;
  if not app_private.hit_rate_limit('contrib:' || p_session || ':' || c.id, 3, 3600)
     or not app_private.hit_rate_limit('contrib-ip:' || app_private.client_ip() || ':' || c.id, 15, 3600) then
    raise exception 'You''ve added a few messages already — try again later.' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 or char_length(trim(coalesce(p_message, ''))) = 0 then
    raise exception 'Add your name and a message.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_media) <> 'array' or jsonb_array_length(p_media) > 3 then
    raise exception 'Up to 3 attachments.' using errcode = '22023';
  end if;
  for v_item in select * from jsonb_array_elements(p_media) loop
    if (v_item ->> 'path') is null or (v_item ->> 'path') not like 'contributions/' || c.id::text || '/%' or (v_item ->> 'type') not in ('image', 'video') then
      raise exception 'Invalid attachment.' using errcode = '22023';
    end if;
  end loop;

  insert into public.group_contributions (card_id, contributor_name, message, color, media_references, contributor_session, status, approved_at)
  values (
    c.id, left(trim(p_name), 60), left(trim(p_message), 1000),
    case when p_color ~ '^#[0-9A-Fa-f]{6}$' then p_color else '#F9D9D3' end,
    p_media, p_session,
    case when c.contributions_require_approval then 'pending'::public.contribution_status else 'approved'::public.contribution_status end,
    case when c.contributions_require_approval then null else now() end
  ) returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'status', v_row.status);
end $$;

-- ---------------------------------------------------------------- storage helpers
-- users/{uid}/{card_id}/{file}  |  contributions/{card_id}/{file}  |  responses/{card_id}/{file}
create or replace function app_private.storage_card_id(p_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
declare parts text[] := string_to_array(p_name, '/');
begin
  if parts[1] = 'users' and array_length(parts, 1) = 4 then return parts[3]::uuid;
  elsif parts[1] in ('contributions', 'responses') and array_length(parts, 1) = 3 then return parts[2]::uuid;
  end if;
  return null;
exception when others then return null;
end $$;

create or replace function app_private.storage_is_public(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cards c
    where c.id = app_private.storage_card_id(p_name) and app_private.card_is_public(c) and c.password_hash is null
      and (c.status = 'published' or c.scheduled_at <= now())
  );
$$;

create or replace function app_private.storage_accepts_contribution(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cards c
    where c.id = app_private.storage_card_id(p_name) and split_part(p_name, '/', 1) = 'contributions'
      and c.experience_type = 'together' and c.contribution_token is not null and c.status <> 'archived' and not c.is_disabled
      and (c.contribution_deadline is null or c.contribution_deadline > now())
  );
$$;

create or replace function app_private.storage_accepts_response(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cards c
    where c.id = app_private.storage_card_id(p_name) and split_part(p_name, '/', 1) = 'responses'
      and c.allow_response_photo and app_private.card_is_public(c)
  );
$$;

create or replace function app_private.storage_owner_can_read(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cards c where c.id = app_private.storage_card_id(p_name) and public.can_edit_card(c.id));
$$;

-- ---------------------------------------------------------------- admin
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorised.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'newUsers7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'cards', (select count(*) from public.cards where not is_sample),
    'published', (select count(*) from public.cards where status in ('published', 'scheduled') and not is_sample),
    'opened', (select count(*) from public.card_views),
    'reactions', (select count(*) from public.card_reactions),
    'purchases', (select count(*) from public.purchases where status = 'paid'),
    'activeSubscriptions', (select count(*) from public.subscriptions where status in ('active', 'trialing')),
    'storageBytes', (select coalesce(sum(file_size), 0) from public.card_media),
    'openReports', (select count(*) from public.card_reports where status = 'open'),
    'aiGenerations30d', (select count(*) from public.ai_generations where created_at > now() - interval '30 days')
  );
end $$;

create or replace function public.admin_list_users(p_search text default null, p_limit int default 25, p_offset int default 0)
returns table (id uuid, email text, display_name text, role text, plan public.plan_tier, suspended_at timestamptz, created_at timestamptz, card_count bigint, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorised.' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, public.plan_for(p.id), p.suspended_at, p.created_at,
      (select count(*) from public.cards c where c.owner_id = p.id), u.last_sign_in_at
    from public.profiles p join auth.users u on u.id = p.id
    where p_search is null or u.email ilike '%' || p_search || '%' or p.display_name ilike '%' || p_search || '%'
    order by p.created_at desc
    limit least(p_limit, 100) offset greatest(p_offset, 0);
end $$;

create or replace function public.admin_set_suspension(p_user uuid, p_suspend boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorised.' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You can''t suspend yourself.' using errcode = '22023'; end if;
  update public.profiles set suspended_at = case when p_suspend then now() end, suspension_reason = case when p_suspend then left(p_reason, 500) end where id = p_user;
end $$;

create or replace function public.admin_moderate_card(p_card_id uuid, p_disable boolean, p_reason text default null, p_report_id uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorised.' using errcode = '42501'; end if;
  update public.cards set is_disabled = p_disable, disabled_reason = case when p_disable then coalesce(left(p_reason, 500), 'Removed for violating our guidelines') end where id = p_card_id;
  update public.card_reports set status = case when p_disable then 'actioned'::public.report_status else 'dismissed'::public.report_status end, reviewed_by = auth.uid(), reviewed_at = now()
  where (p_report_id is not null and id = p_report_id) or (p_report_id is null and card_id = p_card_id and status = 'open');
end $$;

-- ---------------------------------------------------------------- background worker (service role only)
create or replace function public.claim_due_deliveries(p_limit int default 20)
returns table (job_id uuid, card_id uuid, delivery_email text, slug text, recipient_name text, sender_name text, title text, attempts int)
language sql security definer set search_path = '' as $$
  with due as (
    select j.id from public.delivery_jobs j
    join public.cards c on c.id = j.card_id
    where j.status = 'scheduled' and j.scheduled_at <= now() and app_private.card_is_public(c)
    order by j.scheduled_at
    limit least(p_limit, 100)
    for update of j skip locked
  )
  update public.delivery_jobs j set status = 'sending', attempts = j.attempts + 1
  from due, public.cards c
  where j.id = due.id and c.id = j.card_id
  returning j.id, j.card_id, j.delivery_email, c.slug, c.recipient_name, c.sender_name, c.title, j.attempts;
$$;

create or replace function public.finish_delivery(p_job_id uuid, p_ok boolean, p_error text default null) returns void
language sql security definer set search_path = '' as $$
  update public.delivery_jobs set
    status = case when p_ok then 'sent'::public.delivery_status when attempts >= 5 then 'failed'::public.delivery_status else 'scheduled'::public.delivery_status end,
    sent_at = case when p_ok then now() end,
    scheduled_at = case when p_ok or attempts >= 5 then scheduled_at else now() + make_interval(mins => power(2, attempts)::int) end,
    error_message = left(p_error, 1000)
  where id = p_job_id and status = 'sending';
$$;

create or replace function public.abandoned_media(p_older_than_hours int default 24, p_limit int default 200)
returns table (id uuid, storage_path text, thumbnail_path text)
language sql stable security definer set search_path = '' as $$
  select cm.id, cm.storage_path, cm.thumbnail_path from public.card_media cm
  where (cm.status = 'pending' and cm.created_at < now() - make_interval(hours => p_older_than_hours))
     or (cm.card_id is null and cm.created_at < now() - interval '30 days')
  limit least(p_limit, 1000);
$$;

-- ---------------------------------------------------------------- grants
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
grant execute on function public.get_public_card(text, text) to anon, authenticated;
grant execute on function public.get_card_share_meta(text) to anon, authenticated;
grant execute on function public.get_public_media_paths(text, uuid[]) to anon, authenticated;
grant execute on function public.record_card_view(text, text) to anon, authenticated;
grant execute on function public.complete_card_view(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.submit_reaction(text, text, text, text, text) to anon, authenticated;
grant execute on function public.report_card(text, text, text) to anon, authenticated;
grant execute on function public.get_contribution_invite(text) to anon, authenticated;
grant execute on function public.submit_contribution(text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.can_edit_card(uuid) to authenticated;
grant execute on function public.my_plan() to authenticated;
grant execute on function public.new_card_slug() to authenticated;
grant execute on function public.rate_limit_self(text, int, int) to authenticated;
grant execute on function public.publish_card(uuid, timestamptz, text, text) to authenticated;
grant execute on function public.unpublish_card(uuid, boolean) to authenticated;
grant execute on function public.set_card_password(uuid, text) to authenticated;
grant execute on function public.regenerate_contribution_token(uuid) to authenticated;
grant execute on function public.mark_card_received(text, boolean) to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_list_users(text, int, int) to authenticated;
grant execute on function public.admin_set_suspension(uuid, boolean, text) to authenticated;
grant execute on function public.admin_moderate_card(uuid, boolean, text, uuid) to authenticated;
-- Trigger helpers must stay callable by the roles whose writes fire them.
grant execute on function public.set_updated_at() to authenticated, anon;
grant execute on function public.handle_new_user() to supabase_auth_admin;
-- claim_due_deliveries, finish_delivery and abandoned_media stay service-role only.
grant execute on function public.claim_due_deliveries(int) to service_role;
grant execute on function public.finish_delivery(uuid, boolean, text) to service_role;
grant execute on function public.abandoned_media(int, int) to service_role;
