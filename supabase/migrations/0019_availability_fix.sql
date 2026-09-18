-- 0019: Verfügbarkeitsprüfung ohne Mitternachtsregel (Nachtfahrten dürfen über Mitternacht gehen); Arbeitszeiten je Kalendertag des Beginns.
create or replace function app.instructor_is_available(p_instructor uuid, p_period tstzrange, p_tz text default 'Europe/Berlin')
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_start timestamp; v_end timestamp; v_wd smallint; v_has_rules boolean; v_end_time time;
begin
  if exists (select 1 from public.instructor_absences a where a.instructor_id = p_instructor and a.period && p_period) then
    return false;
  end if;
  v_start = lower(p_period) at time zone p_tz; v_end = upper(p_period) at time zone p_tz;
  v_wd = extract(isodow from v_start);
  -- Endzeit am Starttag; über Mitternacht zählt als 24:00
  v_end_time = case when v_end::date > v_start::date then time '23:59:59' else v_end::time end;
  select exists (select 1 from public.instructor_availability r where r.instructor_id = p_instructor and r.kind = 'work'
                 and r.valid_from <= v_start::date and (r.valid_until is null or r.valid_until >= v_start::date)) into v_has_rules;
  if not v_has_rules then return true; end if;
  if not exists (select 1 from public.instructor_availability r where r.instructor_id = p_instructor and r.kind = 'work' and r.weekday = v_wd
                 and r.start_time <= v_start::time and r.end_time >= v_end_time
                 and r.valid_from <= v_start::date and (r.valid_until is null or r.valid_until >= v_start::date)) then
    return false;
  end if;
  if exists (select 1 from public.instructor_availability r where r.instructor_id = p_instructor and r.kind = 'break' and r.weekday = v_wd
             and r.start_time < v_end_time and r.end_time > v_start::time
             and r.valid_from <= v_start::date and (r.valid_until is null or r.valid_until >= v_start::date)) then
    return false;
  end if;
  return true;
end $$;
