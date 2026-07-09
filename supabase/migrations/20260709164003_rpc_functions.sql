-- RPC functions (security definer for controlled discovery)

create or replace function public.venue_active_check_in_counts()
returns table (venue_id uuid, active_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select ci.venue_id, count(*)::bigint as active_count
  from public.check_ins ci
  where ci.expires_at > timezone('utc', now())
  group by ci.venue_id;
$$;

grant execute on function public.venue_active_check_in_counts() to authenticated, anon;

create or replace function public.get_room_peers()
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  mode text,
  group_size text,
  friends_interests text[],
  friends_music text[],
  friends_hobbies text[],
  friends_fun_facts text,
  networking_role text,
  networking_industry text,
  networking_skills text[],
  dating_aesthetic text,
  dating_chemistry_notes text,
  connection_id uuid,
  connection_status text,
  i_want boolean,
  they_want boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid := auth.uid();
  v_check_in record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_check_in
  from public.check_ins
  where user_id = v_user_id
    and expires_at > timezone('utc', now());

  if not found then
    return;
  end if;

  return query
  select
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    ci.mode,
    ci.group_size,
    p.friends_interests,
    p.friends_music,
    p.friends_hobbies,
    p.friends_fun_facts,
    p.networking_role,
    p.networking_industry,
    p.networking_skills,
    p.dating_aesthetic,
    p.dating_chemistry_notes,
    c.id as connection_id,
    c.status as connection_status,
    case
      when c.user_one = v_user_id then c.user_one_wants
      when c.user_two = v_user_id then c.user_two_wants
      else null
    end as i_want,
    case
      when c.user_one = v_user_id then c.user_two_wants
      when c.user_two = v_user_id then c.user_one_wants
      else null
    end as they_want
  from public.check_ins ci
  join public.profiles p on p.id = ci.user_id
  left join public.connections c on (
    (c.user_one = least(v_user_id, ci.user_id) and c.user_two = greatest(v_user_id, ci.user_id))
  )
  where ci.venue_id = v_check_in.venue_id
    and ci.mode = v_check_in.mode
    and ci.expires_at > timezone('utc', now())
    and ci.user_id <> v_user_id
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = v_user_id and b.blocked_id = ci.user_id)
         or (b.blocker_id = ci.user_id and b.blocked_id = v_user_id)
    );
end;
$$;

grant execute on function public.get_room_peers() to authenticated;

create or replace function public.request_connection(target_user_id uuid)
returns public.connections
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_check_in record;
  v_target_check_in record;
  v_one uuid;
  v_two uuid;
  v_row public.connections;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if target_user_id = v_user_id then
    raise exception 'Cannot connect with yourself';
  end if;

  select * into v_check_in
  from public.check_ins
  where user_id = v_user_id
    and expires_at > timezone('utc', now());

  if not found then
    raise exception 'You must be checked in';
  end if;

  select * into v_target_check_in
  from public.check_ins
  where user_id = target_user_id
    and venue_id = v_check_in.venue_id
    and mode = v_check_in.mode
    and expires_at > timezone('utc', now());

  if not found then
    raise exception 'Target user not in your room';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_user_id and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = v_user_id)
  ) then
    raise exception 'Blocked';
  end if;

  v_one := least(v_user_id, target_user_id);
  v_two := greatest(v_user_id, target_user_id);

  insert into public.connections (venue_id, user_one, user_two, user_one_wants, user_two_wants, status)
  values (
    v_check_in.venue_id,
    v_one,
    v_two,
    v_user_id = v_one,
    v_user_id = v_two,
    'pending'
  )
  on conflict (user_one, user_two) do update set
    user_one_wants = case when v_user_id = v_one then true else connections.user_one_wants end,
    user_two_wants = case when v_user_id = v_two then true else connections.user_two_wants end,
    venue_id = excluded.venue_id
  returning * into v_row;

  if v_row.user_one_wants and v_row.user_two_wants then
    update public.connections
    set status = 'connected'
    where id = v_row.id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

grant execute on function public.request_connection(uuid) to authenticated;

create or replace function public.block_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (v_user_id, target_user_id)
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.checkout_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.check_ins where user_id = v_user_id;
end;
$$;

grant execute on function public.checkout_user() to authenticated;

-- Expire stale check-ins (callable by cron or on-demand)
create or replace function public.expire_stale_check_ins()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.check_ins where expires_at <= timezone('utc', now());
$$;

grant execute on function public.expire_stale_check_ins() to authenticated;
