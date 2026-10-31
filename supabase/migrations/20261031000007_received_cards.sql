-- The signed-in user's received cards with just the public details needed to list them (one query, no N+1).
create or replace function public.my_received_cards(p_offset int default 0, p_limit int default 24)
returns table (slug text, title text, sender_name text, occasion text, palette text, motif text, saved boolean, opened_at timestamptz, received_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.slug,
         coalesce(t.preview_data ->> 'headline', c.title),
         c.sender_name,
         c.card_data ->> 'occasion',
         c.card_data ->> 'palette',
         coalesce(t.preview_data ->> 'motif', 'envelope'),
         r.saved, r.last_opened_at, r.first_opened_at
  from public.received_cards r
  join public.cards c on c.id = r.card_id
  left join public.templates t on t.id = c.template_id
  where r.user_id = auth.uid() and app_private.card_is_public(c)
  order by r.last_opened_at desc
  limit least(p_limit, 100) offset greatest(p_offset, 0);
$$;
revoke execute on function public.my_received_cards(int, int) from public, anon;
grant execute on function public.my_received_cards(int, int) to authenticated;
