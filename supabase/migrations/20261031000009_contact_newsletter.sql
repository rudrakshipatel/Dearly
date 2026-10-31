-- Support messages and newsletter sign-ups (write-only for visitors, readable by admins).
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null check (char_length(topic) <= 60),
  message text not null check (char_length(message) between 10 and 2000),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.newsletter_subscribers (
  email text primary key check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
create policy contact_admin on public.contact_messages for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy newsletter_admin on public.newsletter_subscribers for select to authenticated using ((select public.is_admin()));

create or replace function public.submit_contact(p_name text, p_email text, p_topic text, p_message text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.hit_rate_limit('contact-ip:' || app_private.client_ip(), 5, 3600) then
    raise exception 'Too many messages — please try again later.' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  insert into public.contact_messages (user_id, name, email, topic, message) values (auth.uid(), trim(p_name), lower(trim(p_email)), p_topic, trim(p_message));
end $$;

create or replace function public.subscribe_newsletter(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.hit_rate_limit('newsletter-ip:' || app_private.client_ip(), 5, 3600) then
    raise exception 'Too many requests — please try again later.' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  insert into public.newsletter_subscribers (email) values (lower(trim(p_email)))
  on conflict (email) do update set unsubscribed_at = null, consented_at = now();
end $$;
revoke execute on function public.submit_contact(text, text, text, text) from public;
revoke execute on function public.subscribe_newsletter(text) from public;
grant execute on function public.submit_contact(text, text, text, text) to anon, authenticated;
grant execute on function public.subscribe_newsletter(text) to anon, authenticated;
