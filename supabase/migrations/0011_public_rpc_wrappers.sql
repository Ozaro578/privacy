-- 0011: Öffentliche Wrapper für RPC-Funktionen, damit supabase.rpc('...') ohne zusätzliche exponierte Schemas funktioniert.
create or replace function public.book_lesson(p_lesson_id uuid, p_student_license_id uuid, p_client_request_id uuid default gen_random_uuid())
returns public.lessons language sql security invoker as $$ select * from app.book_lesson(p_lesson_id, p_student_license_id, p_client_request_id) $$;
create or replace function public.cancel_lesson(p_lesson_id uuid, p_reason text default null, p_client_request_id uuid default gen_random_uuid())
returns public.lesson_bookings language sql security invoker as $$ select * from app.cancel_lesson(p_lesson_id, p_reason, p_client_request_id) $$;
create or replace function public.create_checkin_token(p_theory_class_id uuid, p_ttl_seconds integer default 60, p_max_uses integer default null)
returns text language sql security invoker as $$ select app.create_checkin_token(p_theory_class_id, p_ttl_seconds, p_max_uses) $$;
create or replace function public.checkin_theory_class(p_token text, p_device_fingerprint text default null, p_geo_distance_m integer default null)
returns public.attendance language sql security invoker as $$ select * from app.checkin_theory_class(p_token, p_device_fingerprint, p_geo_distance_m) $$;
create or replace function public.issue_invoice(p_invoice_id uuid, p_due_days integer default 14)
returns public.invoices language sql security invoker as $$ select * from app.issue_invoice(p_invoice_id, p_due_days) $$;
create or replace function public.special_drive_progress(p_student_license_id uuid)
returns table (kind app.lesson_kind, units integer) language sql security invoker as $$ select * from app.special_drive_progress(p_student_license_id) $$;
create or replace function public.rule_version_for(p_rule_type app.rule_type, p_license_code text, p_acquisition text, p_on date default current_date)
returns setof public.rule_versions language sql stable security invoker as $$ select (app.rule_version_for(p_rule_type, p_license_code, p_acquisition, p_on)).* where (app.rule_version_for(p_rule_type, p_license_code, p_acquisition, p_on)).id is not null $$;
create or replace function public.rule_version_for_any(p_rule_type app.rule_type, p_license_code text, p_acquisition text, p_on date default current_date)
returns setof public.rule_versions language sql stable security invoker as $$ select (app.rule_version_for_any(p_rule_type, p_license_code, p_acquisition, p_on)).* where (app.rule_version_for_any(p_rule_type, p_license_code, p_acquisition, p_on)).id is not null $$;
create or replace function public.offer_lesson_to_waitlist(p_lesson_id uuid) returns integer
language sql security invoker as $$ select app.offer_lesson_to_waitlist(p_lesson_id) $$;
create or replace function public.current_student_id() returns uuid language sql stable security invoker as $$ select app.current_student_id() $$;
create or replace function public.current_instructor_id() returns uuid language sql stable security invoker as $$ select app.current_instructor_id() $$;
grant execute on all functions in schema public to authenticated, service_role;
