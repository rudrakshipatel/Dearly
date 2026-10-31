-- Public bucket for catalogue artwork (template / occasion thumbnails). Only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "catalog: admins write" on storage.objects for insert to authenticated
with check (bucket_id = 'catalog' and (select public.is_admin()));
create policy "catalog: admins update" on storage.objects for update to authenticated
using (bucket_id = 'catalog' and (select public.is_admin()));
create policy "catalog: admins delete" on storage.objects for delete to authenticated
using (bucket_id = 'catalog' and (select public.is_admin()));

-- Admin view of reports with the card details needed to decide.
create or replace function public.admin_reports(p_status public.report_status default 'open', p_limit int default 50)
returns table (id uuid, card_id uuid, slug text, title text, owner_email text, reason text, details text, status public.report_status, created_at timestamptz, card_disabled boolean, report_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorised.' using errcode = '42501'; end if;
  return query
    select r.id, c.id, c.slug, c.title, u.email::text, r.reason, r.details, r.status, r.created_at, c.is_disabled,
      (select count(*) from public.card_reports r2 where r2.card_id = c.id)
    from public.card_reports r
    join public.cards c on c.id = r.card_id
    left join auth.users u on u.id = c.owner_id
    where r.status = p_status
    order by r.created_at desc
    limit least(p_limit, 200);
end $$;
revoke execute on function public.admin_reports(public.report_status, int) from public, anon;
grant execute on function public.admin_reports(public.report_status, int) to authenticated;
