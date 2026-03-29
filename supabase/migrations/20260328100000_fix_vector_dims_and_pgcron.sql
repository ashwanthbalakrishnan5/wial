-- Fix vector dimensions from 1536 to 768 (Gemini text-embedding-004)
-- Add pg_cron jobs for certification and event reminders

-- ============================================================
-- FIX VECTOR DIMENSIONS
-- ============================================================

-- Drop dependent indexes first
drop index if exists idx_coaches_bio_embedding;
drop index if exists idx_global_coaches_embedding;

-- Alter column type on coaches table
alter table public.coaches
  alter column bio_embedding type vector(768);

-- Recreate HNSW index on coaches
create index idx_coaches_bio_embedding
  on public.coaches using hnsw (bio_embedding vector_cosine_ops);

-- Refresh materialized view (will pick up new dimension)
refresh materialized view concurrently global_coaches;

-- Recreate HNSW index on materialized view
drop index if exists idx_global_coaches_embedding;
create index idx_global_coaches_embedding
  on public.global_coaches using hnsw (bio_embedding vector_cosine_ops);

-- Update the search RPC to use 768 dimensions
create or replace function search_coaches_by_embedding(
  query_embedding vector(768),
  match_limit int default 10,
  filter_chapter_id uuid default null,
  filter_certification text default null,
  filter_language text default null
)
returns table (
  id uuid,
  chapter_id uuid,
  full_name text,
  bio text,
  specializations text[],
  languages text[],
  certification_level text,
  hours_logged int,
  photo_url text,
  city text,
  country text,
  contact_email text,
  contact_phone text,
  website text,
  is_active boolean,
  recertification_due_date timestamptz,
  ce_credits_earned int,
  certification_approved boolean,
  chapter_name text,
  chapter_slug text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    gc.id,
    gc.chapter_id,
    gc.full_name,
    gc.bio,
    gc.specializations,
    gc.languages,
    gc.certification_level,
    gc.hours_logged,
    gc.photo_url,
    gc.city,
    gc.country,
    gc.contact_email,
    gc.contact_phone,
    gc.website,
    gc.is_active,
    gc.recertification_due_date,
    gc.ce_credits_earned,
    gc.certification_approved,
    gc.chapter_name,
    gc.chapter_slug,
    1 - (gc.bio_embedding <=> query_embedding) as similarity
  from global_coaches gc
  where gc.bio_embedding is not null
    and gc.is_active = true
    and (filter_chapter_id is null or gc.chapter_id = filter_chapter_id)
    and (filter_certification is null or gc.certification_level = filter_certification)
    and (filter_language is null or filter_language = any(gc.languages))
  order by gc.bio_embedding <=> query_embedding
  limit match_limit;
end;
$$;

-- ============================================================
-- PG_CRON JOBS
-- ============================================================

-- Enable pg_cron extension (requires superuser, already available on Supabase)
create extension if not exists pg_cron;

-- Daily certification renewal reminder check (runs at 9:00 UTC every day)
-- Sends reminders at 90, 60, and 30 days before recertification_due_date
select cron.schedule(
  'certification-reminder-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-certification-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Daily event reminder check (runs at 8:00 UTC every day)
-- Sends reminders for events starting within 7 days
select cron.schedule(
  'event-reminder-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-event-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
