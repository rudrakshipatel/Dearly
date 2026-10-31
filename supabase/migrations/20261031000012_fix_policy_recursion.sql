-- cards <-> card_collaborators policies referenced each other (infinite recursion).
-- Ownership checks now go through SECURITY DEFINER helpers that bypass RLS internally.
create or replace function public.owns_card(p_card_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cards where id = p_card_id and owner_id = auth.uid());
$$;
create or replace function public.collaborates_on(p_card_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.card_collaborators where card_id = p_card_id and user_id = auth.uid());
$$;
revoke execute on function public.owns_card(uuid) from public, anon;
revoke execute on function public.collaborates_on(uuid) from public, anon;
grant execute on function public.owns_card(uuid) to authenticated;
grant execute on function public.collaborates_on(uuid) to authenticated;

drop policy cards_select on public.cards;
create policy cards_select on public.cards for select to authenticated using (
  owner_id = (select auth.uid()) or (select public.is_admin()) or public.collaborates_on(id)
);

drop policy collaborators_select on public.card_collaborators;
drop policy collaborators_manage on public.card_collaborators;
create policy collaborators_select on public.card_collaborators for select to authenticated using (user_id = (select auth.uid()) or public.owns_card(card_id));
create policy collaborators_manage on public.card_collaborators for all to authenticated using (public.owns_card(card_id)) with check (public.owns_card(card_id));

drop policy views_owner_read on public.card_views;
create policy views_owner_read on public.card_views for select to authenticated using (public.owns_card(card_id));
drop policy reactions_owner_read on public.card_reactions;
drop policy reactions_owner_update on public.card_reactions;
create policy reactions_owner_read on public.card_reactions for select to authenticated using (public.owns_card(card_id));
create policy reactions_owner_update on public.card_reactions for update to authenticated using (public.owns_card(card_id)) with check (public.owns_card(card_id));
drop policy delivery_owner_read on public.delivery_jobs;
create policy delivery_owner_read on public.delivery_jobs for select to authenticated using (public.owns_card(card_id));
