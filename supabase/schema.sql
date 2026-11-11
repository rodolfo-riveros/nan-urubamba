-- =====================================================================
-- Ñan Urubamba · backend comunitario (Supabase)
-- Script idempotente: se puede ejecutar varias veces en el SQL Editor.
--
-- MODERACIÓN (desde el dashboard de Supabase > Table Editor o SQL Editor):
--   * Aprobar una sugerencia de lugar (aparecerá en la app como "comunidad"):
--       update public.place_suggestions set status = 'approved' where id = '<uuid>';
--     Rechazarla:
--       update public.place_suggestions set status = 'rejected' where id = '<uuid>';
--     Ver pendientes:
--       select * from public.place_suggestions where status = 'pending' order by created_at;
--   * Una reseña se oculta sola al acumular 3 reportes. Para revisarla / volver a publicarla:
--       select r.*, (select array_agg(reason) from public.reports where review_id = r.id) as reasons
--         from public.reviews r where status = 'hidden';
--       update public.reviews set status = 'published', report_count = 0 where id = '<uuid>';
--       delete from public.reports where review_id = '<uuid>';   -- opcional: limpiar reportes
--     Ocultar manualmente:  update public.reviews set status = 'hidden' where id = '<uuid>';
--   (El rol anon no puede actualizar ni borrar: solo el dashboard / service_role.)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Reseñas
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  place_id     text not null check (char_length(place_id) between 1 and 120),
  author       text not null check (char_length(author) between 1 and 60),
  country      text check (country is null or char_length(country) <= 60),
  visited_at   text check (visited_at is null or visited_at ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  rating       int  not null check (rating between 1 and 5),
  text         text not null check (char_length(text) between 20 and 600),
  tip          text check (tip is null or char_length(tip) <= 200),
  lang         text not null default 'es' check (lang in ('es', 'en')),
  photos       text[] not null default '{}' check (cardinality(photos) <= 3),
  device_id    text not null check (char_length(device_id) between 8 and 64),
  status       text not null default 'published' check (status in ('published', 'hidden')),
  report_count int  not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists reviews_place_created_idx on public.reviews (place_id, created_at desc);
create index if not exists reviews_status_idx on public.reviews (status);

-- ---------------------------------------------------------------------
-- Sugerencias de lugares (moderadas)
-- ---------------------------------------------------------------------
create table if not exists public.place_suggestions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 80),
  category    text not null check (category in ('paisajes','lagunas','arqueologia','cataratas','miradores','nevados','aventura','cultura')),
  district    text not null check (char_length(district) between 2 and 40),
  lat         double precision check (lat is null or lat between -90 and 90),
  lon         double precision check (lon is null or lon between -180 and 180),
  description text not null check (char_length(description) between 20 and 1500),
  how_to_get  text check (how_to_get is null or char_length(how_to_get) <= 1000),
  tips        text check (tips is null or char_length(tips) <= 600),
  lang        text not null default 'es' check (lang in ('es', 'en')),
  photos      text[] not null default '{}' check (cardinality(photos) <= 3),
  device_id   text not null check (char_length(device_id) between 8 and 64),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

create index if not exists place_suggestions_status_idx on public.place_suggestions (status, created_at desc);

-- ---------------------------------------------------------------------
-- Reportes de reseñas (1 por dispositivo y reseña)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews (id) on delete cascade,
  reason     text check (reason is null or char_length(reason) <= 300),
  device_id  text not null check (char_length(device_id) between 8 and 64),
  created_at timestamptz not null default now(),
  unique (review_id, device_id)
);

create index if not exists reports_review_idx on public.reports (review_id);

-- Trigger: suma reportes y oculta la reseña al llegar a 3
create or replace function public.on_report_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reviews
     set report_count = report_count + 1,
         status = case when report_count + 1 >= 3 then 'hidden' else status end
   where id = new.review_id;
  return new;
end;
$$;

drop trigger if exists reports_after_insert on public.reports;
create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.on_report_inserted();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.reviews           enable row level security;
alter table public.place_suggestions enable row level security;
alter table public.reports           enable row level security;

-- reviews
drop policy if exists "reviews_select_published" on public.reviews;
create policy "reviews_select_published" on public.reviews
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "reviews_insert_anon" on public.reviews;
create policy "reviews_insert_anon" on public.reviews
  for insert to anon, authenticated
  with check (status = 'published' and report_count = 0);

-- place_suggestions
drop policy if exists "suggestions_select_approved" on public.place_suggestions;
create policy "suggestions_select_approved" on public.place_suggestions
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "suggestions_insert_pending" on public.place_suggestions;
create policy "suggestions_insert_pending" on public.place_suggestions
  for insert to anon, authenticated
  with check (status = 'pending');

-- reports (solo insertar; nadie los lee desde la app)
drop policy if exists "reports_insert_anon" on public.reports;
create policy "reports_insert_anon" on public.reports
  for insert to anon, authenticated
  with check (true);

-- Privilegios de columna: device_id NO es legible por el público
-- (si fuera visible, cualquiera podría borrar reseñas ajenas con delete_my_review).
revoke select on public.reviews from anon, authenticated;
grant select (id, place_id, author, country, visited_at, rating, text, tip, lang, photos, status, report_count, created_at)
  on public.reviews to anon, authenticated;
grant insert on public.reviews to anon, authenticated;

revoke select on public.place_suggestions from anon, authenticated;
grant select (id, name, category, district, lat, lon, description, how_to_get, tips, lang, photos, status, created_at)
  on public.place_suggestions to anon, authenticated;
grant insert on public.place_suggestions to anon, authenticated;

revoke select on public.reports from anon, authenticated;
grant insert on public.reports to anon, authenticated;

-- Sin update/delete para anon (no hay políticas; además se revocan los privilegios)
revoke update, delete on public.reviews, public.place_suggestions, public.reports from anon, authenticated;

-- ---------------------------------------------------------------------
-- RPC: un dispositivo borra su propia reseña
-- ---------------------------------------------------------------------
create or replace function public.delete_my_review(review_id uuid, device text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from public.reviews r
   where r.id = delete_my_review.review_id
     and r.device_id = delete_my_review.device;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.delete_my_review(uuid, text) from public;
grant execute on function public.delete_my_review(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: fotos de reseñas y sugerencias (lectura pública por URL)
-- Ruta de objetos: '<carpeta>/<uuid>.jpg'. La app usa como carpeta un id público
-- de dispositivo DISTINTO de device_id: las URLs de las fotos son públicas y
-- device_id es el secreto que autoriza delete_my_review.
-- Bucket público => las URLs públicas funcionan sin política de select; no se crea
-- política de select para que nadie pueda listar el bucket.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "review_photos_public_read" on storage.objects;

drop policy if exists "review_photos_anon_insert" on storage.objects;
create policy "review_photos_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'review-photos'
    and name ~ '^[A-Za-z0-9-]{8,64}/[A-Za-z0-9-]{8,64}\.jpg$'
  );
