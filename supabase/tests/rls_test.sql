-- Authorization boundary tests. Runs inside a transaction that is always rolled back.
-- Usage: supabase db query --linked -f supabase/tests/rls_test.sql
-- Every row in the output must have pass = true.
begin;

create temp table r (n serial, name text, pass boolean, detail text);
grant all on r to authenticated, anon;
grant usage on sequence r_n_seq to authenticated, anon;

-- Fixtures: three users (A: free, B: free, C: pro) — inserted directly, removed by the rollback.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@test.dearly', '', now(), '{"display_name":"Alice"}', now(), now()),
  ('bbbbbbbb-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@test.dearly', '', now(), '{"display_name":"Bob"}', now(), now()),
  ('cccccccc-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-c@test.dearly', '', now(), '{"display_name":"Cara"}', now(), now());
insert into public.subscriptions (user_id, provider, provider_subscription_id, plan, status, current_period_end)
values ('cccccccc-0000-4000-8000-000000000003', 'stripe', 'sub_test_rls', 'pro', 'active', now() + interval '30 days');

insert into r (name, pass) select 'profiles created by signup trigger', count(*) = 3 from public.profiles where id::text like '%-0000-4000-8000-00000000000%';

-- Helper to act as a user.
create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

-- ===================================================== A creates a draft
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
do $$
declare v_id uuid; v_slug text;
begin
  insert into public.cards (owner_id, title, recipient_name, sender_name, experience_type, slug, card_data, template_id, status, show_branding)
  values (auth.uid(), 'Test card', 'Maya', 'Alice', 'letter', 'chosen-by-client', '{"version":2,"pages":[{"id":"p1","background":"#ffffff","pattern":"none","elements":[]}],"palette":"rose-cream"}',
          (select id from public.templates where slug = 'confetti-cake'), 'published', false)
  returning id, slug into v_id, v_slug;
  insert into r (name, pass, detail) values ('insert forces draft + branding + random slug', (select status = 'draft' and show_branding and slug <> 'chosen-by-client' and slug ~ '^[a-z0-9]{12}$' from public.cards where id = v_id), v_slug);
  perform set_config('test.card_a', v_id::text, true);
  perform set_config('test.slug_a', v_slug, true);
end $$;

-- Direct publish (bypassing publish_card) is refused.
do $$ begin
  begin
    update public.cards set status = 'published' where id = current_setting('test.card_a')::uuid;
    insert into r (name, pass) values ('direct status=published blocked', false);
  exception when others then insert into r (name, pass, detail) values ('direct status=published blocked', true, sqlerrm); end;
end $$;

-- Owner can't fake view counts or the slug.
do $$ begin
  begin
    update public.cards set view_count = 999 where id = current_setting('test.card_a')::uuid;
    insert into r (name, pass) values ('view_count tamper blocked', false);
  exception when others then insert into r (name, pass) values ('view_count tamper blocked', true); end;
end $$;

-- Drafts are not public.
insert into r (name, pass) select 'draft not visible via get_public_card', public.get_public_card(current_setting('test.slug_a')) is null;

-- ===================================================== B (another user) attacks A's card
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
insert into r (name, pass) select 'B cannot read A''s card', count(*) = 0 from public.cards where id = current_setting('test.card_a')::uuid;
do $$
declare n int;
begin
  update public.cards set title = 'pwned' where id = current_setting('test.card_a')::uuid;
  get diagnostics n = row_count;
  insert into r (name, pass) values ('B cannot update A''s card', n = 0);
  delete from public.cards where id = current_setting('test.card_a')::uuid;
  get diagnostics n = row_count;
  insert into r (name, pass) values ('B cannot delete A''s card', n = 0);
end $$;
do $$ begin
  begin
    perform public.publish_card(current_setting('test.card_a')::uuid);
    insert into r (name, pass) values ('B cannot publish A''s card', false);
  exception when others then insert into r (name, pass) values ('B cannot publish A''s card', true); end;
end $$;
do $$ begin
  begin
    insert into public.cards (owner_id, experience_type, slug, card_data) values ('aaaaaaaa-0000-4000-8000-000000000001', 'letter', 'aaaaaaaaaaaa', '{}');
    insert into r (name, pass) values ('B cannot create cards owned by A', false);
  exception when others then insert into r (name, pass) values ('B cannot create cards owned by A', true); end;
end $$;
do $$ begin
  begin
    insert into public.card_media (owner_id, media_type, storage_path, mime_type, file_size) values ('aaaaaaaa-0000-4000-8000-000000000001', 'image', 'users/aaaaaaaa-0000-4000-8000-000000000001/x/y.jpg', 'image/jpeg', 100);
    insert into r (name, pass) values ('B cannot register media as A', false);
  exception when others then insert into r (name, pass) values ('B cannot register media as A', true); end;
end $$;
do $$ begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    insert into r (name, pass) values ('self-promotion to admin blocked', false);
  exception when others then insert into r (name, pass) values ('self-promotion to admin blocked', true); end;
end $$;
insert into r (name, pass) select 'B cannot read A''s profile', count(*) = 0 from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001';
do $$ begin
  begin
    perform public.admin_stats();
    insert into r (name, pass) values ('non-admin cannot call admin_stats', false);
  exception when others then insert into r (name, pass) values ('non-admin cannot call admin_stats', true); end;
end $$;

-- ===================================================== A publishes (free plan rules)
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
do $$
declare res jsonb;
begin
  res := public.publish_card(current_setting('test.card_a')::uuid);
  insert into r (name, pass, detail) values ('owner can publish a free card', res ->> 'status' = 'published', res::text);
end $$;
insert into r (name, pass) select 'published card is public', (public.get_public_card(current_setting('test.slug_a')) ->> 'state') = 'open';

-- Removing branding on the free plan is refused.
do $$ begin
  begin
    update public.cards set show_branding = false where id = current_setting('test.card_a')::uuid;
    insert into r (name, pass) values ('free plan cannot remove branding on live card', false);
  exception when others then insert into r (name, pass, detail) values ('free plan cannot remove branding on live card', true, sqlerrm); end;
end $$;

-- Premium template on free plan is refused.
do $$
declare v uuid;
begin
  insert into public.cards (owner_id, experience_type, slug, card_data, recipient_name, template_id)
  values (auth.uid(), 'classic', 'x', '{"version":2,"pages":[{"id":"p1","background":"#ffffff","pattern":"none","elements":[]}]}', 'Sam', (select id from public.templates where slug = 'golden-thirty'))
  returning id into v;
  begin
    perform public.publish_card(v);
    insert into r (name, pass) values ('free plan cannot publish premium template', false);
  exception when others then insert into r (name, pass, detail) values ('free plan cannot publish premium template', true, sqlerrm); end;
  begin
    perform public.publish_card(v, now() + interval '2 days');
    insert into r (name, pass) values ('free plan cannot schedule', false);
  exception when others then insert into r (name, pass) values ('free plan cannot schedule', true); end;
end $$;

-- Video upload on free plan is refused.
do $$ begin
  begin
    insert into public.card_media (owner_id, media_type, storage_path, mime_type, file_size) values (auth.uid(), 'video', 'users/' || auth.uid() || '/library/v.mp4', 'video/mp4', 1000);
    insert into r (name, pass) values ('free plan cannot upload video', false);
  exception when others then insert into r (name, pass) values ('free plan cannot upload video', true); end;
end $$;
-- Oversized image refused.
do $$ begin
  begin
    insert into public.card_media (owner_id, media_type, storage_path, mime_type, file_size) values (auth.uid(), 'image', 'users/' || auth.uid() || '/library/big.jpg', 'image/jpeg', 11 * 1024 * 1024);
    insert into r (name, pass) values ('image over 10 MB refused', false);
  exception when others then insert into r (name, pass) values ('image over 10 MB refused', true); end;
end $$;
-- Unreferenced/pending media blocks publishing a card that uses it.
do $$
declare m uuid; v uuid;
begin
  insert into public.card_media (owner_id, media_type, storage_path, mime_type, file_size) values (auth.uid(), 'image', 'users/' || auth.uid() || '/library/p.jpg', 'image/jpeg', 1000) returning id into m;
  insert into public.cards (owner_id, experience_type, slug, card_data, recipient_name, template_id)
  values (auth.uid(), 'letter', 'x', jsonb_build_object('version', 2, 'pages', jsonb_build_array(jsonb_build_object('id', 'p', 'background', '#fff', 'pattern', 'none', 'elements', jsonb_build_array(jsonb_build_object('type', 'image', 'src', 'media:' || m))))), 'Sam', (select id from public.templates where slug = 'confetti-cake'))
  returning id into v;
  begin
    perform public.publish_card(v);
    insert into r (name, pass) values ('cannot publish with un-uploaded media', false);
  exception when others then insert into r (name, pass, detail) values ('cannot publish with un-uploaded media', true, sqlerrm); end;
end $$;

-- Password protection.
select public.set_card_password(current_setting('test.card_a')::uuid, 'secret-pass');
insert into r (name, pass) select 'password-protected card is locked', (public.get_public_card(current_setting('test.slug_a')) ->> 'state') = 'locked';
insert into r (name, pass) select 'wrong password stays locked', (public.get_public_card(current_setting('test.slug_a'), 'nope') ->> 'state') = 'locked';
insert into r (name, pass) select 'right password opens', (public.get_public_card(current_setting('test.slug_a'), 'secret-pass') ->> 'state') = 'open';
select public.set_card_password(current_setting('test.card_a')::uuid, null);

-- Disabling access hides it.
update public.cards set is_disabled = true where id = current_setting('test.card_a')::uuid;
insert into r (name, pass) select 'disabled card is hidden', public.get_public_card(current_setting('test.slug_a')) is null;
update public.cards set is_disabled = false where id = current_setting('test.card_a')::uuid;

-- ===================================================== Anonymous recipient
select pg_temp.as_anon();
insert into r (name, pass) select 'anon sees published card', (public.get_public_card(current_setting('test.slug_a')) ->> 'state') = 'open';
do $$ begin
  begin
    perform count(*) from public.cards;
    insert into r (name, pass) select 'anon cannot list cards table', count(*) = 0 from public.cards;
  exception when others then insert into r (name, pass) values ('anon cannot list cards table', true); end;
end $$;
do $$
declare v uuid;
begin
  v := public.record_card_view(current_setting('test.slug_a'), 'session-abcdefgh');
  insert into r (name, pass) values ('anon view recorded', v is not null);
  perform public.submit_reaction(current_setting('test.slug_a'), 'session-abcdefgh', 'love', 'Thank you!');
  insert into r (name, pass) values ('anon can react', true);
exception when others then insert into r (name, pass, detail) values ('anon view/react', false, sqlerrm);
end $$;
do $$ begin
  begin
    perform public.submit_reaction(current_setting('test.slug_a'), 'session-abcdefgh', 'love', 'spam');
    perform public.submit_reaction(current_setting('test.slug_a'), 'session-abcdefgh', 'love', 'spam');
    perform public.submit_reaction(current_setting('test.slug_a'), 'session-abcdefgh', 'love', 'spam');
    insert into r (name, pass) values ('reaction rate limit', false);
  exception when others then insert into r (name, pass) values ('reaction rate limit', true); end;
end $$;
do $$ begin
  begin
    perform public.claim_due_deliveries(10);
    insert into r (name, pass) values ('anon cannot run delivery worker', false);
  exception when others then insert into r (name, pass) values ('anon cannot run delivery worker', true); end;
end $$;

-- Owner sees the open and the reaction; B doesn't.
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
insert into r (name, pass) select 'owner sees view count', view_count = 1 from public.cards where id = current_setting('test.card_a')::uuid;
insert into r (name, pass) select 'owner sees reaction', count(*) = 1 from public.card_reactions where card_id = current_setting('test.card_a')::uuid;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
insert into r (name, pass) select 'B cannot read A''s reactions', count(*) = 0 from public.card_reactions where card_id = current_setting('test.card_a')::uuid;

-- ===================================================== Group cards
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
do $$
declare v uuid; tok text;
begin
  insert into public.cards (owner_id, experience_type, slug, card_data, recipient_name, template_id)
  values (auth.uid(), 'together', 'x', '{"version":2,"pages":[{"id":"p1","background":"#ffffff","pattern":"none","elements":[]}]}', 'Leo', (select id from public.templates where slug = 'everyone-sings'))
  returning id into v;
  tok := public.regenerate_contribution_token(v);
  perform set_config('test.group', v::text, true);
  perform set_config('test.token', tok, true);
  insert into r (name, pass) values ('owner gets unguessable contributor token', tok ~ '^[A-Za-z0-9]{32}$');
end $$;
select pg_temp.as_anon();
do $$
declare res jsonb;
begin
  res := public.submit_contribution(current_setting('test.token'), 'contrib-session-1', 'Priya', 'Happy birthday!', '#F9D9D3', '[]');
  insert into r (name, pass) values ('contributor submits without account (pending)', res ->> 'status' = 'pending');
  begin
    perform public.submit_contribution(current_setting('test.token'), 'contrib-session-2', 'Eve', 'x', '#F9D9D3', '[{"path":"users/someone/else.jpg","type":"image"}]');
    insert into r (name, pass) values ('contributor cannot attach foreign files', false);
  exception when others then insert into r (name, pass) values ('contributor cannot attach foreign files', true); end;
  begin
    perform public.submit_contribution('WrongToken000000000000000000000000', 'contrib-session-3', 'Eve', 'x');
    insert into r (name, pass) values ('wrong token rejected', false);
  exception when others then insert into r (name, pass) values ('wrong token rejected', true); end;
end $$;
insert into r (name, pass) select 'pending contributions not public', jsonb_array_length(public.get_contribution_invite(current_setting('test.token')) -> 'contributions') = 0;
do $$ begin
  insert into r (name, pass) select 'anon cannot read contributions table', count(*) = 0 from public.group_contributions;
exception when others then insert into r (name, pass) values ('anon cannot read contributions table', true);
end $$;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
do $$
declare n int;
begin
  update public.group_contributions set status = 'approved' where card_id = current_setting('test.group')::uuid;
  get diagnostics n = row_count;
  insert into r (name, pass) values ('non-owner cannot approve contributions', n = 0);
end $$;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
update public.group_contributions set status = 'approved', approved_at = now() where card_id = current_setting('test.group')::uuid;
insert into r (name, pass) select 'approved contribution becomes visible', jsonb_array_length(public.get_contribution_invite(current_setting('test.token')) -> 'contributions') = 1;

-- ===================================================== Pro user can schedule
select pg_temp.as_user('cccccccc-0000-4000-8000-000000000003');
do $$
declare v uuid; res jsonb;
begin
  insert into public.cards (owner_id, experience_type, slug, card_data, recipient_name, template_id)
  values (auth.uid(), 'classic', 'x', '{"version":2,"pages":[{"id":"p1","background":"#ffffff","pattern":"none","elements":[]}]}', 'Sam', (select id from public.templates where slug = 'golden-thirty'))
  returning id into v;
  res := public.publish_card(v, now() + interval '2 days', 'Europe/London', 'sam@example.com');
  insert into r (name, pass, detail) values ('pro user schedules premium template', res ->> 'status' = 'scheduled', res::text);
  insert into r (name, pass) select 'delivery job created', count(*) = 1 from public.delivery_jobs where card_id = v and status = 'scheduled';
  insert into r (name, pass) select 'scheduled card stays sealed', (public.get_public_card(res ->> 'slug') ->> 'state') = 'scheduled';
  perform public.unpublish_card(v);
  insert into r (name, pass) select 'unpublish cancels delivery', count(*) = 0 from public.delivery_jobs where card_id = v and status = 'scheduled';
end $$;

reset role;
select json_agg(json_build_object('test', name, 'pass', pass, 'detail', left(detail, 140)) order by n) as results,
       count(*) filter (where pass) as passed,
       count(*) filter (where not pass or pass is null) as failed
from r;
rollback;
