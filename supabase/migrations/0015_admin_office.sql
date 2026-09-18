-- 0015: Fahrschul-Administration (Büro/Admin/Owner): Webhook-Idempotenz, Sichtbarkeit eingeladener Mitglieder,
--       Aktivierung von Einladungen bei der ersten Anmeldung. Ausschließlich additiv.

-- Verarbeitete Zahlungsanbieter-Ereignisse (Idempotenz zusätzlich zu payments.webhook_event_id). Nur Service-Role.
create table if not exists public.payment_webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'ignored', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  primary key (provider, event_id)
);
alter table public.payment_webhook_events enable row level security;
alter table public.payment_webhook_events force row level security;
revoke all on public.payment_webhook_events from authenticated, anon;

-- Büro sieht auch eingeladene (noch nicht aktivierte) Mitglieder des eigenen Tenants.
create policy users_select_invited_office on public.users for select to authenticated using (
  app.is_office() and exists (select 1 from public.tenant_memberships m where m.user_id = users.id and m.tenant_id = app.current_tenant_id() and m.status = 'invited'));

-- Eingeladene Mitglieder werden bei der ersten Anmeldung aktiv (Supabase setzt last_sign_in_at). Verknüpft außerdem Schülerdatensätze per E-Mail.
create or replace function public.handle_auth_user_signed_in() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.tenant_memberships m set status = 'active' where m.user_id = new.id and m.status = 'invited';
  update public.students s set user_id = new.id where s.user_id is null and s.email is not null and s.email = new.email;
  update public.users u set active_tenant_id = coalesce(u.active_tenant_id, (select m.tenant_id from public.tenant_memberships m where m.user_id = new.id and m.status = 'active' order by m.created_at limit 1))
    where u.id = new.id;
  return new;
end $$;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'last_sign_in_at') then
    drop trigger if exists on_auth_user_signed_in on auth.users;
    create trigger on_auth_user_signed_in after update of last_sign_in_at on auth.users for each row
      when (old.last_sign_in_at is distinct from new.last_sign_in_at) execute function public.handle_auth_user_signed_in();
  end if;
end $$;

-- Bestätigung einer Buchungsanfrage durch das Büro (Status booked -> confirmed, Historie, Benachrichtigung)
create or replace function app.confirm_lesson_booking(p_lesson_id uuid)
returns public.lessons language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_lesson public.lessons;
begin
  v_tenant = app.current_tenant_id();
  if v_tenant is null or not app.is_office() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  select * into v_lesson from public.lessons where id = p_lesson_id and tenant_id = v_tenant for update;
  if not found then raise exception 'Fahrstunde nicht gefunden' using errcode = 'P0002'; end if;
  if v_lesson.status <> 'booked' or v_lesson.student_id is null then raise exception 'Nur Buchungsanfragen können bestätigt werden' using errcode = 'P0001'; end if;
  update public.lessons set status = 'confirmed' where id = p_lesson_id returning * into v_lesson;
  insert into public.lesson_bookings (tenant_id, lesson_id, student_id, student_license_id, action, acted_by)
    values (v_tenant, p_lesson_id, v_lesson.student_id, v_lesson.student_license_id, 'confirmed', auth.uid());
  insert into public.notifications (tenant_id, user_id, notification_type, title, body, data, channels, dedupe_key)
    select v_tenant, s.user_id, 'lesson_confirmed', 'Fahrstunde bestätigt',
           format('Deine Fahrstunde am %s Uhr wurde von der Fahrschule bestätigt.', to_char(lower(v_lesson.period) at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI')),
           jsonb_build_object('lesson_id', p_lesson_id), '{push,in_app}', 'lesson_confirmed:' || p_lesson_id
    from public.students s where s.id = v_lesson.student_id and s.user_id is not null
    on conflict do nothing;
  return v_lesson;
end $$;
create or replace function public.confirm_lesson_booking(p_lesson_id uuid)
returns public.lessons language sql security invoker as $$ select * from app.confirm_lesson_booking(p_lesson_id) $$;
grant execute on function app.confirm_lesson_booking(uuid) to authenticated, service_role;
grant execute on function public.confirm_lesson_booking(uuid) to authenticated, service_role;
