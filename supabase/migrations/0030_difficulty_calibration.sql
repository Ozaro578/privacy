-- 0030: Kalibrierung der Fragen-Schwierigkeit aus echten Antwortdaten. Die redaktionelle Schwierigkeit (Seed bzw. Import)
-- bleibt als Ausgangswert erhalten (authored_difficulty); die wirksame difficulty ist ab genügend Antworten eine Mischung aus
-- Ausgangswert und beobachteter Fehlerquote über alle Schüler (Erstantworten zählen doppelt, weil Wiederholungen leichter sind).
-- Läuft täglich per Cron; die Stufen-Einteilung (1 bis 5) und der Stufen-Modus folgen der kalibrierten difficulty.
alter table public.theory_questions add column if not exists authored_difficulty numeric(3,2);
alter table public.theory_questions add column if not exists calibration_sample integer not null default 0;
alter table public.theory_questions add column if not exists calibrated_at timestamptz;
update public.theory_questions set authored_difficulty = difficulty where authored_difficulty is null;

create or replace function public.calibrate_question_difficulty(p_min_sample integer default 30, p_weight numeric default 0.5) returns integer
language plpgsql security definer set search_path = public as $$
declare v_changed integer := 0; r record; v_new numeric;
begin
  for r in
    select q.id, coalesce(q.authored_difficulty, q.difficulty) as authored, q.difficulty as current,
           count(*)::integer as sample,
           -- gewichtete Fehlerquote: Erstversuch je Schüler zählt 2, jeder weitere 1
           sum(case when a.is_correct then 0 else 1 end * case when a.rn = 1 then 2 else 1 end)::numeric
             / nullif(sum(case when a.rn = 1 then 2 else 1 end), 0) as error_rate
    from public.theory_questions q
    join (select question_id, is_correct, row_number() over (partition by student_id, question_id order by answered_at) as rn
          from public.student_question_attempts where exam_simulation_id is null) a on a.question_id = q.id
    where q.status = 'published'
    group by q.id, q.authored_difficulty, q.difficulty
    having count(*) >= p_min_sample
  loop
    v_new := round(least(0.95, greatest(0.05, (1 - p_weight) * r.authored + p_weight * r.error_rate)), 2);
    if v_new is distinct from r.current then
      update public.theory_questions set difficulty = v_new, calibration_sample = r.sample, calibrated_at = now() where id = r.id;
      v_changed := v_changed + 1;
    else
      update public.theory_questions set calibration_sample = r.sample, calibrated_at = now() where id = r.id and calibration_sample <> r.sample;
    end if;
  end loop;
  return v_changed;
end $$;
revoke all on function public.calibrate_question_difficulty(integer, numeric) from public;
grant execute on function public.calibrate_question_difficulty(integer, numeric) to service_role;
