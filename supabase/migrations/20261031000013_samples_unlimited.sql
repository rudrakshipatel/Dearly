-- System sample cards have no owner; give them the top plan so demos aren't capped by Free limits.
create or replace function app_private.card_plan(p_card public.cards) returns public.plan_tier
language sql stable security definer set search_path = '' as $$
  select case when p_card.is_sample then 'pro'::public.plan_tier else greatest(
    public.plan_for(p_card.owner_id),
    case when exists (
      select 1 from public.purchases p
      where p.card_id = p_card.id and p.status = 'paid' and p.product_type in ('premium_card', 'special_experience')
    ) then 'premium'::public.plan_tier else 'free'::public.plan_tier end
  ) end;
$$;
