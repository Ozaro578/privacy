-- 0010: Serverseitige Funktionen für integritätskritische Abläufe (Buchung, Stornierung, Warteliste, QR-Check-in, Rechnungen)

-- Regelversion inkl. nicht freigegebener Werte (für Anzeige "fachlich zu verifizieren")
create or replace function app.rule_version_for_any(p_rule_type app.rule_type, p_license_code text, p_acquisition text, p_on date default current_date)
returns public.rule_versions language sql stable security definer set search_path = public as $$
  select rv.* from public.rule_versions rv
  where rv.rule_type = p_rule_type
    and rv.license_code is not distinct from p_license_code
    and rv.acquisition_kind in (p_acquisition, 'any')
    and rv.review_status in ('published', 'needs_verification')
    and rv.valid_from <= p_on and (rv.valid_until is null or rv.valid_until >= p_on)
  order by case when rv.review_status = 'published' then 0 else 1 end,
           case when rv.acquisition_kind = p_acquisition then 0 else 1 end, rv.version desc
  limit 1
$$;

-- Stornierungsregel der Fahrschule am Stichtag
create or replace function app.cancellation_policy_for(p_tenant uuid, p_on date default current_date)
returns public.cancellation_policies language sql stable security definer set search_path = public as $$
  select * from public.cancellation_policies
  where tenant_id = p_tenant and valid_from <= p_on and (valid_until is null or valid_until >= p_on)
  order by valid_from desc limit 1
$$;

-- Verfügbarkeit: liegt der Zeitraum in den Arbeitszeiten (falls gepflegt), außerhalb von Pausen und Abwesenheiten?
create or replace function app.instructor_is_available(p_instructor uuid, p_period tstzrange, p_tz text default 'Europe/Berlin')
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_start timestamp; v_end timestamp; v_wd smallint; v_has_rules boolean;
begin
  if exists (select 1 from public.instructor_absences a where a.instructor_id = p_instructor and a.period && p_period) then
    return false;
  end if;
  v_start = lower(p_period) at time zone p_tz; v_end = upper(p_period) at time zone p_tz;
  if v_start::date <> (v_end - interval '1 second')::date then return false; end if;   -- keine Stunden über Mitternacht
  v_wd = extract(isodow from v_start);
  select exists (select 1 from public.instructor_availability r where r.instructor_id = p_instructor and r.kind = 'work'
                 and r.valid_from <= v_start::date and (r.valid_until is null or r.valid_until >= v_start::date)) into v_has_rules;
  if not v_has_rules then return true; end if;
  if not exists (select 1 from public.instructor_availability r where r.instructor_id = p_instructor and r.kind = 'work' and r.weekday = v_wd
                 and r.start_time <= v_start::time and r.end_time >= v_end::time
                 and r.valid_from <= v_start::date and (r.valid_until is null or r.valid_until >= v_start::date)) then
    return false;
  end if;
  if exists (select 1 from public.instructor_availability r where r.instructor_id = p_instructor and r.kind = 'break' and r.weekday = v_wd
             and r.start_time < v_end::time and r.end_time > v_start::time
             and r.valid_from <= v_start::date and (r.valid_until is null or r.valid_until >= v_start::date)) then
    return false;
  end if;
  return true;
end $$;

-- Fahrstunde buchen (Schüler bucht sich selbst oder Mitarbeiter bucht für Schüler)
create or replace function app.book_lesson(p_lesson_id uuid, p_student_license_id uuid, p_client_request_id uuid default gen_random_uuid())
returns public.lessons language plpgsql security definer set search_path = public as $$
declare v_lesson public.lessons; v_sl public.student_licenses; v_ins public.instructors; v_veh public.vehicles; v_tenant uuid; v_settings jsonb; v_auto boolean;
begin
  v_tenant = app.current_tenant_id();
  if v_tenant is null then raise exception 'Kein Tenant im Token' using errcode = '42501'; end if;
  select * into v_sl from public.student_licenses where id = p_student_license_id and tenant_id = v_tenant;
  if not found then raise exception 'Ausbildung nicht gefunden' using errcode = 'P0002'; end if;
  if not app.is_staff() and v_sl.student_id is distinct from app.current_student_id() then
    raise exception 'Keine Berechtigung für diese Ausbildung' using errcode = '42501';
  end if;
  if v_sl.status <> 'active' then raise exception 'Ausbildung ist nicht aktiv' using errcode = 'P0001'; end if;
  select * into v_lesson from public.lessons where id = p_lesson_id and tenant_id = v_tenant for update;
  if not found then raise exception 'Fahrstunde nicht gefunden' using errcode = 'P0002'; end if;
  if v_lesson.status <> 'open' or v_lesson.student_id is not null then raise exception 'Fahrstunde ist nicht mehr frei' using errcode = 'P0001'; end if;
  if lower(v_lesson.period) < now() then raise exception 'Fahrstunde liegt in der Vergangenheit' using errcode = 'P0001'; end if;
  if cardinality(v_lesson.license_codes) > 0 and not (v_sl.license_code = any(v_lesson.license_codes)) then
    raise exception 'Fahrstunde ist nicht für Klasse % vorgesehen', v_sl.license_code using errcode = 'P0001';
  end if;
  if v_lesson.transmission is not null and v_lesson.transmission <> v_sl.transmission then
    raise exception 'Getriebeart passt nicht zur Ausbildung' using errcode = 'P0001';
  end if;
  select * into v_ins from public.instructors where id = v_lesson.instructor_id;
  if not v_ins.active then raise exception 'Fahrlehrer ist nicht aktiv' using errcode = 'P0001'; end if;
  if cardinality(v_ins.license_classes) > 0 and not (v_sl.license_code = any(v_ins.license_classes)) and not (coalesce((select base_class from public.licenses where code = v_sl.license_code), '') = any(v_ins.license_classes)) then
    raise exception 'Fahrlehrer besitzt keine Fahrlehrerlaubnis für Klasse %', v_sl.license_code using errcode = 'P0001';
  end if;
  if not app.instructor_is_available(v_ins.id, v_lesson.period) then raise exception 'Fahrlehrer ist zu dieser Zeit nicht verfügbar' using errcode = 'P0001'; end if;
  if v_lesson.vehicle_id is not null then
    select * into v_veh from public.vehicles where id = v_lesson.vehicle_id;
    if v_veh.status <> 'active' then raise exception 'Fahrzeug ist nicht verfügbar' using errcode = 'P0001'; end if;
    if v_veh.transmission <> v_sl.transmission then raise exception 'Fahrzeug hat falsche Getriebeart' using errcode = 'P0001'; end if;
    if exists (select 1 from public.vehicle_blocks b where b.vehicle_id = v_veh.id and b.period && v_lesson.period) then
      raise exception 'Fahrzeug ist gesperrt' using errcode = 'P0001';
    end if;
  end if;
  select settings into v_settings from public.driving_schools where id = v_tenant;
  v_auto = coalesce((v_settings ->> 'auto_confirm_bookings')::boolean, true);
  update public.lessons set student_id = v_sl.student_id, student_license_id = v_sl.id,
    status = case when v_auto then 'confirmed'::app.lesson_status else 'booked'::app.lesson_status end
    where id = p_lesson_id returning * into v_lesson;
  insert into public.lesson_bookings (tenant_id, lesson_id, student_id, student_license_id, action, acted_by, client_request_id)
    values (v_tenant, p_lesson_id, v_sl.student_id, v_sl.id, case when v_auto then 'confirmed' else 'requested' end, auth.uid(), p_client_request_id)
    on conflict (lesson_id, client_request_id) do nothing;
  update public.waitlist_entries set status = 'fulfilled' where student_id = v_sl.student_id and status in ('active', 'offered')
    and earliest <= lower(v_lesson.period) and latest >= upper(v_lesson.period);
  return v_lesson;
exception when exclusion_violation then
  raise exception 'Zeitüberschneidung: Fahrlehrer, Fahrzeug oder Schüler sind bereits verplant' using errcode = 'P0001';
end $$;

-- Warteliste benachrichtigen, wenn ein Slot frei wird
create or replace function app.offer_lesson_to_waitlist(p_lesson_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare v_lesson public.lessons; v_count integer := 0; r record; v_local timestamp;
begin
  select * into v_lesson from public.lessons where id = p_lesson_id;
  if not found or v_lesson.status <> 'open' then return 0; end if;
  v_local = lower(v_lesson.period) at time zone 'Europe/Berlin';
  for r in
    select w.*, s.user_id from public.waitlist_entries w join public.students s on s.id = w.student_id
    where w.tenant_id = v_lesson.tenant_id and w.status = 'active'
      and w.earliest <= lower(v_lesson.period) and w.latest >= upper(v_lesson.period)
      and (w.instructor_id is null or w.instructor_id = v_lesson.instructor_id)
      and (w.transmission is null or v_lesson.transmission is null or w.transmission = v_lesson.transmission)
      and extract(isodow from v_local)::smallint = any(w.weekdays)
      and (w.time_from is null or w.time_from <= v_local::time) and (w.time_to is null or w.time_to >= (upper(v_lesson.period) at time zone 'Europe/Berlin')::time)
    order by w.created_at
  loop
    insert into public.waitlist_offers (tenant_id, waitlist_entry_id, lesson_id, expires_at)
      values (v_lesson.tenant_id, r.id, p_lesson_id, least(now() + interval '2 hours', lower(v_lesson.period)))
      on conflict do nothing;
    update public.waitlist_entries set status = 'offered' where id = r.id;
    if r.user_id is not null then
      insert into public.notifications (tenant_id, user_id, notification_type, title, body, data, channels, dedupe_key)
        values (v_lesson.tenant_id, r.user_id, 'waitlist_offer', 'Fahrstunde frei geworden',
                format('Am %s um %s Uhr ist eine Fahrstunde frei geworden.', to_char(v_local, 'DD.MM.YYYY'), to_char(v_local, 'HH24:MI')),
                jsonb_build_object('lesson_id', p_lesson_id), '{push,in_app}', 'waitlist_offer:' || p_lesson_id)
        on conflict do nothing;
    end if;
    v_count = v_count + 1;
  end loop;
  return v_count;
end $$;

-- Fahrstunde stornieren (Schüler: Slot wird wieder frei; Fahrschule: Stunde entfällt). Gebühr nach gültiger Regel.
create or replace function app.cancel_lesson(p_lesson_id uuid, p_reason text default null, p_client_request_id uuid default gen_random_uuid())
returns public.lesson_bookings language plpgsql security definer set search_path = public as $$
declare v_lesson public.lessons; v_tenant uuid; v_hours numeric; v_policy public.cancellation_policies; v_fee integer := 0; v_fee_reason text; v_booking public.lesson_bookings; v_by_student boolean; v_price integer;
begin
  v_tenant = app.current_tenant_id();
  select * into v_lesson from public.lessons where id = p_lesson_id and tenant_id = v_tenant for update;
  if not found then raise exception 'Fahrstunde nicht gefunden' using errcode = 'P0002'; end if;
  if v_lesson.status in ('cancelled', 'completed', 'no_show') then raise exception 'Fahrstunde kann nicht mehr storniert werden' using errcode = 'P0001'; end if;
  v_by_student = not app.is_staff();
  if v_by_student and v_lesson.student_id is distinct from app.current_student_id() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  if not v_by_student and not app.is_office() and v_lesson.instructor_id is distinct from app.current_instructor_id() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  v_hours = extract(epoch from (lower(v_lesson.period) - now())) / 3600.0;
  v_policy = app.cancellation_policy_for(v_tenant);
  if v_by_student and v_policy.id is not null and v_hours < v_policy.free_cancellation_hours then
    v_price = coalesce(v_lesson.price_cents, 0);
    v_fee = coalesce(v_policy.late_fee_fixed_cents, 0) + coalesce(round(v_price * coalesce(v_policy.late_fee_percent, 0) / 100.0)::integer, 0);
    v_fee_reason = format('Stornierung %s Stunden vor Beginn (kostenfrei bis %s Stunden), Regel "%s"%s', round(v_hours, 1), v_policy.free_cancellation_hours, v_policy.name,
                          coalesce(', ' || v_policy.contract_clause_reference, ''));
  end if;
  insert into public.lesson_bookings (tenant_id, lesson_id, student_id, student_license_id, action, acted_by, hours_before_start, policy_id, fee_cents, fee_reason, client_request_id, note)
    values (v_tenant, p_lesson_id, coalesce(v_lesson.student_id, app.current_student_id()), v_lesson.student_license_id,
            case when v_by_student then 'cancelled_by_student' else 'cancelled_by_school' end, auth.uid(), round(v_hours, 2), v_policy.id, nullif(v_fee, 0), v_fee_reason, p_client_request_id, p_reason)
    on conflict (lesson_id, client_request_id) do update set note = excluded.note returning * into v_booking;
  if v_by_student then
    update public.lessons set student_id = null, student_license_id = null, status = 'open' where id = p_lesson_id;
    perform app.offer_lesson_to_waitlist(p_lesson_id);
  else
    update public.lessons set status = 'cancelled' where id = p_lesson_id;
    if v_lesson.student_id is not null then
      insert into public.notifications (tenant_id, user_id, notification_type, title, body, data, channels, dedupe_key)
        select v_tenant, s.user_id, 'lesson_cancelled', 'Fahrstunde abgesagt',
               format('Deine Fahrstunde am %s wurde von der Fahrschule abgesagt.', to_char(lower(v_lesson.period) at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI')),
               jsonb_build_object('lesson_id', p_lesson_id), '{push,in_app}', 'lesson_cancelled:' || p_lesson_id
        from public.students s where s.id = v_lesson.student_id and s.user_id is not null on conflict do nothing;
    end if;
  end if;
  return v_booking;
end $$;

-- Rotierenden Check-in-Code für Theorieunterricht erzeugen (Klartext wird nur zurückgegeben, gespeichert wird der Hash)
create or replace function app.create_checkin_token(p_theory_class_id uuid, p_ttl_seconds integer default 60, p_max_uses integer default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_token text; v_class public.theory_classes;
begin
  v_tenant = app.current_tenant_id();
  if not app.is_staff() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  select * into v_class from public.theory_classes where id = p_theory_class_id and tenant_id = v_tenant;
  if not found then raise exception 'Unterricht nicht gefunden' using errcode = 'P0002'; end if;
  v_token = encode(gen_random_bytes(24), 'hex');
  insert into public.theory_class_checkin_tokens (tenant_id, theory_class_id, token_hash, valid_until, max_uses, created_by)
    values (v_tenant, p_theory_class_id, encode(digest(v_token, 'sha256'), 'hex'), now() + make_interval(secs => least(p_ttl_seconds, 600)), p_max_uses, auth.uid());
  update public.theory_classes set status = 'running' where id = p_theory_class_id and status = 'planned';
  return v_token;
end $$;

-- Schüler checkt per QR ein. Missbrauchsschutz: kurzlebiger Code, Zeitfenster um den Unterricht, ein Check-in je Schüler, Gerätefingerabdruck wird protokolliert.
create or replace function app.checkin_theory_class(p_token text, p_device_fingerprint text default null, p_geo_distance_m integer default null)
returns public.attendance language plpgsql security definer set search_path = public as $$
declare v_tok public.theory_class_checkin_tokens; v_class public.theory_classes; v_student uuid; v_att public.attendance; v_sl uuid;
begin
  v_student = app.current_student_id();
  if v_student is null then raise exception 'Nur Schüler können einchecken' using errcode = '42501'; end if;
  select * into v_tok from public.theory_class_checkin_tokens where token_hash = encode(digest(p_token, 'sha256'), 'hex') for update;
  if not found or v_tok.tenant_id <> app.current_tenant_id() then raise exception 'Code ungültig' using errcode = 'P0001'; end if;
  if now() < v_tok.valid_from or now() > v_tok.valid_until then raise exception 'Code abgelaufen' using errcode = 'P0001'; end if;
  if v_tok.max_uses is not null and v_tok.uses >= v_tok.max_uses then raise exception 'Code bereits verbraucht' using errcode = 'P0001'; end if;
  select * into v_class from public.theory_classes where id = v_tok.theory_class_id;
  if now() < lower(v_class.period) - interval '20 minutes' or now() > upper(v_class.period) + interval '20 minutes' then
    raise exception 'Check-in nur im Zeitfenster des Unterrichts möglich' using errcode = 'P0001';
  end if;
  if p_device_fingerprint is not null and exists (select 1 from public.attendance a where a.theory_class_id = v_class.id and a.device_fingerprint = p_device_fingerprint and a.student_id <> v_student) then
    raise exception 'Dieses Gerät wurde bereits für einen anderen Schüler verwendet' using errcode = 'P0001';
  end if;
  select id into v_sl from public.student_licenses where student_id = v_student and status = 'active' order by started_at desc limit 1;
  insert into public.attendance (tenant_id, theory_class_id, student_id, student_license_id, status, check_in_method, checked_in_at, checked_in_by, device_fingerprint, geo_distance_m)
    values (v_class.tenant_id, v_class.id, v_student, v_sl, 'present', 'qr', now(), auth.uid(), p_device_fingerprint, p_geo_distance_m)
    on conflict (theory_class_id, student_id) do update set status = 'present', check_in_method = 'qr', checked_in_at = now()
    returning * into v_att;
  update public.theory_class_checkin_tokens set uses = uses + 1 where id = v_tok.id;
  return v_att;
end $$;

-- Rechnung ausstellen: Summen aus Positionen, lückenlose Nummer, Fälligkeit
create or replace function app.issue_invoice(p_invoice_id uuid, p_due_days integer default 14)
returns public.invoices language plpgsql security definer set search_path = public as $$
declare v_inv public.invoices; v_net integer; v_vat integer;
begin
  if not app.is_office() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  select * into v_inv from public.invoices where id = p_invoice_id and tenant_id = app.current_tenant_id() for update;
  if not found then raise exception 'Rechnung nicht gefunden' using errcode = 'P0002'; end if;
  if v_inv.status <> 'draft' then raise exception 'Rechnung ist bereits ausgestellt' using errcode = 'P0001'; end if;
  select coalesce(sum(round(quantity * unit_net_cents))::integer, 0), coalesce(sum(round(quantity * unit_net_cents * vat_rate / 100.0))::integer, 0)
    into v_net, v_vat from public.invoice_items where invoice_id = p_invoice_id;
  if v_net <= 0 then raise exception 'Rechnung ohne Positionen kann nicht ausgestellt werden' using errcode = 'P0001'; end if;
  update public.invoices set invoice_number = app.next_invoice_number(tenant_id, extract(year from current_date)::integer),
    status = 'issued', issued_at = current_date, due_at = current_date + p_due_days, net_cents = v_net, vat_cents = v_vat, gross_cents = v_net + v_vat
    where id = p_invoice_id returning * into v_inv;
  return v_inv;
end $$;

-- Ausbildungsstand: Sonderfahrten-Einheiten je Art (abgeschlossene Stunden)
create or replace function app.special_drive_progress(p_student_license_id uuid)
returns table (kind app.lesson_kind, units integer) language sql stable security definer set search_path = public as $$
  select l.kind, coalesce(sum(l.units), 0)::integer from public.lessons l
  where l.student_license_id = p_student_license_id and l.status = 'completed' and l.kind in ('overland', 'motorway', 'night')
  group by l.kind
$$;

grant execute on all functions in schema app to authenticated, service_role;
