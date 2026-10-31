-- Catalogue policies call is_admin(); it simply returns false for anonymous visitors.
grant execute on function public.is_admin() to anon;
