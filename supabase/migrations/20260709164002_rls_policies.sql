-- Row Level Security policies

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.check_ins enable row level security;
alter table public.connections enable row level security;
alter table public.blocks enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- Profiles: owner only
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- Venues: public read
drop policy if exists venues_select_all on public.venues;
create policy venues_select_all on public.venues
  for select using (true);

-- Check-ins: owner CRUD only; no public listing
drop policy if exists check_ins_select_own on public.check_ins;
create policy check_ins_select_own on public.check_ins
  for select using (auth.uid() = user_id);

drop policy if exists check_ins_insert_own on public.check_ins;
create policy check_ins_insert_own on public.check_ins
  for insert with check (auth.uid() = user_id);

drop policy if exists check_ins_update_own on public.check_ins;
create policy check_ins_update_own on public.check_ins
  for update using (auth.uid() = user_id);

drop policy if exists check_ins_delete_own on public.check_ins;
create policy check_ins_delete_own on public.check_ins
  for delete using (auth.uid() = user_id);

-- Connections: participants only
drop policy if exists connections_select_participant on public.connections;
create policy connections_select_participant on public.connections
  for select using (auth.uid() in (user_one, user_two));

drop policy if exists connections_update_participant on public.connections;
create policy connections_update_participant on public.connections
  for update using (auth.uid() in (user_one, user_two));

-- Blocks: owner insert/select
drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own on public.blocks
  for insert with check (auth.uid() = blocker_id);

-- Messages: connected participants only
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select using (
    exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'connected'
        and auth.uid() in (c.user_one, c.user_two)
    )
  );

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'connected'
        and auth.uid() in (c.user_one, c.user_two)
    )
  );

-- Reports: owner insert
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (auth.uid() = reporter_id);
