-- Covering indexes for foreign keys (cascades and joins stay fast as data grows).
create index if not exists ai_generations_card_idx on public.ai_generations (card_id) where card_id is not null;
create index if not exists card_reports_card_idx on public.card_reports (card_id);
create index if not exists card_reports_reviewer_idx on public.card_reports (reviewed_by) where reviewed_by is not null;
create index if not exists cards_occasion_idx on public.cards (occasion_id);
create index if not exists cards_template_idx on public.cards (template_id);
create index if not exists contact_messages_user_idx on public.contact_messages (user_id) where user_id is not null;
create index if not exists received_cards_card_idx on public.received_cards (card_id);
