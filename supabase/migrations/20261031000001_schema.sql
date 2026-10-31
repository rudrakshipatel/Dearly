-- Dearly core schema
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- enums
create type public.card_status as enum ('draft', 'published', 'scheduled', 'archived');
create type public.experience_type as enum ('letter', 'surprise', 'memories', 'reveal', 'together', 'classic', 'video');
create type public.media_type as enum ('image', 'video', 'audio');
create type public.media_status as enum ('pending', 'ready');
create type public.contribution_status as enum ('pending', 'approved', 'rejected');
create type public.collaborator_permission as enum ('owner', 'editor', 'contributor');
create type public.plan_tier as enum ('free', 'premium', 'pro');
create type public.payment_provider as enum ('stripe', 'razorpay');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'expired');
create type public.purchase_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.purchase_product as enum ('premium_card', 'group_card', 'special_experience');
create type public.delivery_status as enum ('scheduled', 'sending', 'sent', 'failed', 'cancelled');
create type public.ai_generation_type as enum ('message', 'poem', 'story', 'caption', 'design');
create type public.ai_generation_status as enum ('succeeded', 'failed', 'blocked');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text check (char_length(avatar_url) <= 500),
  preferred_language text not null default 'en' check (char_length(preferred_language) <= 10),
  preferred_currency text check (preferred_currency ~ '^[A-Z]{3}$'),
  timezone text check (char_length(timezone) <= 64),
  role text not null default 'user' check (role in ('user', 'admin')),
  suspended_at timestamptz,
  suspension_reason text check (char_length(suspension_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), 80),
    left(new.raw_user_meta_data ->> 'avatar_url', 500)
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- catalogue
create table public.occasions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  description text check (char_length(description) <= 1000),
  thumbnail_url text check (char_length(thumbnail_url) <= 500),
  theme_config jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  description text check (char_length(description) <= 1000),
  occasion_id uuid not null references public.occasions (id) on delete restrict,
  experience_type public.experience_type not null,
  thumbnail_url text check (char_length(thumbnail_url) <= 500),
  preview_data jsonb not null default '{}'::jsonb,
  default_card_data jsonb not null default '{}'::jsonb,
  supported_interactions jsonb not null default '[]'::jsonb,
  style_category text not null,
  is_premium boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index templates_occasion_idx on public.templates (occasion_id);
create index templates_published_idx on public.templates (is_published) where is_published;
create trigger templates_updated_at before update on public.templates for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- cards
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  is_sample boolean not null default false,
  title text not null default '' check (char_length(title) <= 120),
  recipient_name text not null default '' check (char_length(recipient_name) <= 60),
  sender_name text not null default '' check (char_length(sender_name) <= 60),
  recipient_email text check (recipient_email is null or (char_length(recipient_email) <= 254 and recipient_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  occasion_id uuid references public.occasions (id) on delete set null,
  template_id uuid references public.templates (id) on delete set null,
  experience_type public.experience_type not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{8,64}$'),
  status public.card_status not null default 'draft',
  card_data jsonb not null,
  schema_version int not null default 2,
  version int not null default 1,
  scheduled_at timestamptz,
  timezone text check (char_length(timezone) <= 64),
  published_at timestamptz,
  expires_at timestamptz,
  password_hash text,
  is_disabled boolean not null default false,
  disabled_reason text check (char_length(disabled_reason) <= 500),
  allow_reactions boolean not null default true,
  allow_response_photo boolean not null default false,
  show_branding boolean not null default true,
  -- Group (Together) settings
  contribution_token text unique check (contribution_token is null or contribution_token ~ '^[A-Za-z0-9]{24,64}$'),
  contribution_deadline timestamptz,
  contribution_limit int check (contribution_limit is null or contribution_limit between 1 and 1000),
  contributions_require_approval boolean not null default true,
  view_count int not null default 0,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_owner_or_sample check (owner_id is not null or is_sample),
  constraint cards_card_data_object check (jsonb_typeof(card_data) = 'object'),
  constraint cards_scheduled_has_time check (status <> 'scheduled' or scheduled_at is not null)
);
create index cards_owner_status_idx on public.cards (owner_id, status, updated_at desc);
create index cards_owner_updated_idx on public.cards (owner_id, updated_at desc);
create index cards_scheduled_idx on public.cards (scheduled_at) where status = 'scheduled';
create index cards_title_search_idx on public.cards using gin (to_tsvector('simple', title || ' ' || recipient_name));
create trigger cards_updated_at before update on public.cards for each row execute function public.set_updated_at();

create table public.card_collaborators (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission public.collaborator_permission not null,
  invited_at timestamptz not null default now(),
  unique (card_id, user_id)
);
create index card_collaborators_user_idx on public.card_collaborators (user_id);

create table public.card_media (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.cards (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  media_type public.media_type not null,
  status public.media_status not null default 'pending',
  storage_path text not null unique check (char_length(storage_path) <= 300),
  thumbnail_path text check (char_length(thumbnail_path) <= 300),
  original_filename text check (char_length(original_filename) <= 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg', 'audio/wav')),
  file_size bigint not null check (file_size > 0),
  width int check (width is null or width between 1 and 20000),
  height int check (height is null or height between 1 and 20000),
  duration numeric(8, 2) check (duration is null or duration >= 0),
  created_at timestamptz not null default now()
);
create index card_media_card_idx on public.card_media (card_id);
create index card_media_owner_idx on public.card_media (owner_id, created_at desc);
create index card_media_pending_idx on public.card_media (created_at) where status = 'pending';

create table public.card_views (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  viewer_session_id text not null check (char_length(viewer_session_id) between 8 and 64),
  opened_at timestamptz not null default now(),
  completed_at timestamptz,
  interaction_summary jsonb not null default '{}'::jsonb
);
create index card_views_card_idx on public.card_views (card_id, opened_at desc);

create table public.card_reactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('love', 'tears', 'hug', 'wow', 'thanks')),
  message text check (char_length(message) <= 500),
  photo_path text check (char_length(photo_path) <= 300),
  seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index card_reactions_card_idx on public.card_reactions (card_id, created_at desc);

create table public.group_contributions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  contributor_name text not null check (char_length(contributor_name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 1000),
  color text not null default '#F9D9D3' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  media_references jsonb not null default '[]'::jsonb check (jsonb_typeof(media_references) = 'array' and jsonb_array_length(media_references) <= 3),
  contributor_session text check (char_length(contributor_session) <= 64),
  status public.contribution_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz
);
create index group_contributions_card_idx on public.group_contributions (card_id, status, submitted_at);

create table public.received_cards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  saved boolean not null default false,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- ---------------------------------------------------------------- billing
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.payment_provider not null,
  provider_customer_id text,
  provider_subscription_id text not null,
  plan public.plan_tier not null check (plan <> 'free'),
  status public.subscription_status not null,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);
create index subscriptions_user_idx on public.subscriptions (user_id, status);
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid references public.cards (id) on delete set null,
  provider public.payment_provider not null,
  provider_payment_id text not null,
  product_type public.purchase_product not null,
  amount bigint not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status public.purchase_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index purchases_user_idx on public.purchases (user_id, created_at desc);
create index purchases_card_idx on public.purchases (card_id) where card_id is not null;
create trigger purchases_updated_at before update on public.purchases for each row execute function public.set_updated_at();

create table public.payment_events (
  provider public.payment_provider not null,
  event_id text not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- ---------------------------------------------------------------- delivery
create table public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  delivery_email text check (delivery_email is null or (char_length(delivery_email) <= 254 and delivery_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  scheduled_at timestamptz not null,
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  status public.delivery_status not null default 'scheduled',
  attempts int not null default 0,
  sent_at timestamptz,
  error_message text check (char_length(error_message) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_jobs_due_idx on public.delivery_jobs (scheduled_at) where status = 'scheduled';
create index delivery_jobs_card_idx on public.delivery_jobs (card_id);
-- At most one live job per card.
create unique index delivery_jobs_one_live_per_card on public.delivery_jobs (card_id) where status in ('scheduled', 'sending');
create trigger delivery_jobs_updated_at before update on public.delivery_jobs for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- AI
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid references public.cards (id) on delete set null,
  generation_type public.ai_generation_type not null,
  input_metadata jsonb not null default '{}'::jsonb,
  status public.ai_generation_status not null,
  provider text,
  model text,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);
create index ai_generations_user_idx on public.ai_generations (user_id, created_at desc);

-- ---------------------------------------------------------------- moderation & abuse
create table public.card_reports (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  reason text not null check (reason in ('harassment', 'hate', 'sexual', 'violence', 'spam', 'impersonation', 'other')),
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index card_reports_status_idx on public.card_reports (status, created_at desc);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);
