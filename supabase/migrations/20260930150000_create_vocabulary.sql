-- Shared vocabulary schema for the anonymous Italiano app.
-- There are no user accounts. The anon key can read and change this global dataset.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint categories_name_not_blank check (char_length(btrim(name)) > 0)
);

create table public.words (
  id uuid primary key default gen_random_uuid(),
  hungarian text not null,
  italian text not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint words_hungarian_not_blank check (char_length(btrim(hungarian)) > 0),
  constraint words_italian_not_blank check (char_length(btrim(italian)) > 0)
);

create index words_category_id_idx on public.words (category_id);

create table public.test_results (
  id uuid primary key default gen_random_uuid(),
  score integer not null,
  total integer not null,
  category_ids uuid[] not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  constraint test_results_score_nonnegative check (score >= 0),
  constraint test_results_total_nonnegative check (total >= 0),
  constraint test_results_score_lte_total check (score <= total)
);

create index test_results_created_at_idx on public.test_results (created_at desc);

alter table public.categories enable row level security;
alter table public.words enable row level security;
alter table public.test_results enable row level security;

grant select, insert, update, delete on public.categories to anon;
grant select, insert, update, delete on public.words to anon;
grant select, insert on public.test_results to anon;

create policy categories_anon_select on public.categories
  for select to anon using (true);
create policy categories_anon_insert on public.categories
  for insert to anon with check (true);
create policy categories_anon_update on public.categories
  for update to anon using (true) with check (true);
create policy categories_anon_delete on public.categories
  for delete to anon using (true);

create policy words_anon_select on public.words
  for select to anon using (true);
create policy words_anon_insert on public.words
  for insert to anon with check (true);
create policy words_anon_update on public.words
  for update to anon using (true) with check (true);
create policy words_anon_delete on public.words
  for delete to anon using (true);

create policy test_results_anon_select on public.test_results
  for select to anon using (true);
create policy test_results_anon_insert on public.test_results
  for insert to anon with check (true);
