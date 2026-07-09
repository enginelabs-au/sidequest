-- Safety and chat tables

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc', now()) not null,
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz default timezone('utc', now()) not null
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  connection_id uuid references public.connections(id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz default timezone('utc', now()) not null
);

create index messages_connection_idx on public.messages (connection_id, created_at);
create index blocks_blocker_idx on public.blocks (blocker_id);
