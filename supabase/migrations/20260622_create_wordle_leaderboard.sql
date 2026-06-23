create table if not exists public.wordle_leaderboard (
  id uuid primary key default gen_random_uuid(),
  player_name text not null default 'Anonymous',
  mode text not null,
  guesses integer not null,
  solved boolean not null,
  streak integer not null default 0,
  created_at timestamptz default now()
);

alter table public.wordle_leaderboard enable row level security;

create policy "Anon can read Wordle leaderboard"
  on public.wordle_leaderboard for select
  to anon
  using (true);

create policy "Anon can submit Wordle scores"
  on public.wordle_leaderboard for insert
  to anon
  with check (true);

create index if not exists wordle_leaderboard_ranking_idx
  on public.wordle_leaderboard (solved desc, guesses asc, streak desc, created_at desc);
