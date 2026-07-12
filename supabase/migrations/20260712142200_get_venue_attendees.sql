-- Public venue roster for pre-check-in room preview (display name + mode only)

create or replace function public.get_venue_attendees(p_venue_id uuid)
returns table (
  user_id uuid,
  display_name text,
  mode text,
  group_size text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    p.display_name,
    ci.mode,
    ci.group_size
  from public.check_ins ci
  join public.profiles p on p.id = ci.user_id
  where ci.venue_id = p_venue_id
    and ci.expires_at > timezone('utc', now())
  order by ci.created_at desc;
$$;

grant execute on function public.get_venue_attendees(uuid) to authenticated, anon;
