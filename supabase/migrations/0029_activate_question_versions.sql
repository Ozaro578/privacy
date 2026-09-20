-- 0029: Stichtags-Aktivierung für lizenzierte Fragen. Der Importer legt Versionen mit valid_from (1. April, 1. Oktober) an;
-- diese Funktion setzt täglich (Cron) und nach jedem Import die am heutigen Tag gültige Version als aktuelle Version
-- und den Sichtbarkeitsstatus: published (gültige Version vorhanden), approved (nur künftige Version), retired (keine).
create or replace function public.activate_due_question_versions() returns integer
language plpgsql security definer set search_path = public as $$
declare v_changed integer := 0; r record; v_due uuid; v_future boolean; v_status app.review_status; v_current uuid;
begin
  for r in select q.id, q.current_version_id, q.status from public.theory_questions q where q.source = 'official_licensed' loop
    select v.id into v_due from public.question_versions v
      where v.question_id = r.id and v.review_status = 'published' and v.valid_from <= current_date and (v.valid_until is null or v.valid_until >= current_date)
      order by v.version desc limit 1;
    select exists (select 1 from public.question_versions v where v.question_id = r.id and v.review_status = 'published' and v.valid_from > current_date) into v_future;
    if v_due is not null then v_status := 'published'; v_current := v_due;
    elsif v_future then v_status := 'approved';
      select v.id into v_current from public.question_versions v where v.question_id = r.id order by v.version desc limit 1;
    else v_status := 'retired'; v_current := r.current_version_id;
    end if;
    if r.status is distinct from v_status or r.current_version_id is distinct from v_current then
      update public.theory_questions set status = v_status, current_version_id = v_current where id = r.id;
      v_changed := v_changed + 1;
    end if;
  end loop;
  return v_changed;
end $$;
revoke all on function public.activate_due_question_versions() from public;
grant execute on function public.activate_due_question_versions() to service_role;
