-- Rate-limit keys use a one-way hash of the client IP (never the IP itself), and old windows are pruned.
create or replace function app_private.client_ip() returns text
language sql stable set search_path = '' as $$
  select encode(extensions.digest(coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'unknown') || ':dearly-rl', 'sha256'), 'hex');
$$;

create or replace function public.prune_rate_limits() returns int
language sql security definer set search_path = '' as $$
  with d as (delete from public.rate_limits where window_start < now() - interval '1 day' returning 1)
  select count(*)::int from d;
$$;
revoke execute on function public.prune_rate_limits() from public, anon, authenticated;
grant execute on function public.prune_rate_limits() to service_role;

delete from public.rate_limits;
