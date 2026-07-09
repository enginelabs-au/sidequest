-- Core tables: profiles, venues, check_ins, connections

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  friends_interests text[],
  friends_music text[],
  friends_hobbies text[],
  friends_fun_facts text,
  networking_role text,
  networking_industry text,
  networking_skills text[],
  dating_aesthetic text,
  dating_chemistry_notes text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  venue_id uuid references public.venues(id) on delete cascade not null,
  mode text not null check (mode in ('friends', 'dating', 'networking')),
  group_size text not null check (group_size in ('1:1', '1:2', '2:2', '4:4')),
  created_at timestamptz default timezone('utc', now()) not null,
  expires_at timestamptz default (timezone('utc', now()) + interval '4 hours') not null,
  unique (user_id)
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade not null,
  user_one uuid references public.profiles(id) on delete cascade not null,
  user_two uuid references public.profiles(id) on delete cascade not null,
  user_one_wants boolean default false not null,
  user_two_wants boolean default false not null,
  status text not null default 'pending' check (status in ('pending', 'connected')),
  created_at timestamptz default timezone('utc', now()) not null,
  unique (user_one, user_two),
  check (user_one < user_two)
);

create index check_ins_venue_mode_idx on public.check_ins (venue_id, mode);
create index check_ins_expires_at_idx on public.check_ins (expires_at);
create index connections_venue_idx on public.connections (venue_id);
create index connections_users_idx on public.connections (user_one, user_two);
