-- Users record their own AI usage (inserted by the server acting as the user; limits are read from it).
create policy ai_insert_own on public.ai_generations for insert to authenticated with check (user_id = (select auth.uid()));
