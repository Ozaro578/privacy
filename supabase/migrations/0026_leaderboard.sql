-- Wochen-Bestenliste der Fahrschule: freiwillig (Opt-in), zeigt nur Vorname plus Initial und XP der letzten 7 Tage.
alter table public.students add column if not exists leaderboard_opt_in boolean not null default false;

create or replace function public.tenant_leaderboard(p_days integer default 7, p_limit integer default 10)
returns table (rank integer, alias text, xp integer, is_me boolean)
language sql stable security definer set search_path = public as $$
  with me as (select id from public.students where user_id = auth.uid() and tenant_id = app.current_tenant_id() limit 1),
  sums as (
    select s.id, s.first_name, s.last_name, coalesce(sum(x.xp), 0)::integer as xp
    from public.students s
    left join public.xp_events x on x.student_id = s.id and x.created_at >= now() - make_interval(days => greatest(1, least(p_days, 30)))
    where s.tenant_id = app.current_tenant_id() and s.leaderboard_opt_in and s.status in ('registered', 'active')
    group by s.id, s.first_name, s.last_name
  )
  select row_number() over (order by xp desc, first_name)::integer as rank,
         first_name || ' ' || left(last_name, 1) || '.' as alias,
         xp,
         id = (select id from me) as is_me
  from sums
  order by xp desc, first_name
  limit greatest(1, least(p_limit, 50))
$$;
revoke all on function public.tenant_leaderboard(integer, integer) from public;
grant execute on function public.tenant_leaderboard(integer, integer) to authenticated, service_role;
