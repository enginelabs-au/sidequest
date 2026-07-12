-- Self-service account deletion (hard delete).
-- TODO: replace with 30-day soft delete (scheduled purge) when automation is in place.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- Cascades: profiles → check_ins, connections, messages, blocks, reports
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
