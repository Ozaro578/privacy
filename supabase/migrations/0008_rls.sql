-- 0008: Row-Level-Security für alle Tabellen. Grundsatz: Jede Zeile ist nur im eigenen Tenant sichtbar,
--       Schüler sehen ausschließlich eigene Daten, Mitarbeiter nach Rolle. service_role umgeht RLS (nur serverseitig).
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema app to authenticated, service_role;
revoke all on public.invoice_counters from authenticated;
revoke all on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;
revoke all on public.theory_class_checkin_tokens from authenticated;
grant select, insert, update on public.theory_class_checkin_tokens to authenticated;

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Hilfsprozeduren für Standard-Policies -------------------------------------------------
create or replace procedure app.policy_tenant_select(tbl text, extra text default 'true')
language plpgsql as $$
begin
  execute format('create policy %I on public.%I for select to authenticated using (tenant_id = app.current_tenant_id() and (%s))', tbl || '_select', tbl, extra);
end $$;

create or replace procedure app.policy_tenant_write(tbl text, role_check text)
language plpgsql as $$
begin
  execute format('create policy %I on public.%I for insert to authenticated with check (tenant_id = app.current_tenant_id() and (%s))', tbl || '_insert', tbl, role_check);
  execute format('create policy %I on public.%I for update to authenticated using (tenant_id = app.current_tenant_id() and (%s)) with check (tenant_id = app.current_tenant_id() and (%s))', tbl || '_update', tbl, role_check, role_check);
  execute format('create policy %I on public.%I for delete to authenticated using (tenant_id = app.current_tenant_id() and (%s))', tbl || '_delete', tbl, role_check);
end $$;

-- Globale + tenant-eigene Inhalte: lesen, wenn veröffentlicht (oder eigener Tenant/Plattform-Admin), schreiben nur Plattform-Admin (global) bzw. Tenant-Admin (eigene)
create or replace procedure app.policy_content(tbl text, status_col text default 'review_status')
language plpgsql as $$
begin
  execute format($p$create policy %I on public.%I for select to authenticated using (
      (tenant_id is null and (%I = 'published' or app.is_platform_admin()))
      or (tenant_id = app.current_tenant_id() and (%I = 'published' or app.is_admin())))$p$, tbl || '_select', tbl, status_col, status_col);
  execute format($p$create policy %I on public.%I for all to authenticated
      using ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin()))
      with check ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin()))$p$, tbl || '_write', tbl);
end $$;

-- Tenants, Standorte, Nutzer, Mitgliedschaften ---------------------------------------------
create policy driving_schools_select on public.driving_schools for select to authenticated using (id = app.current_tenant_id() or app.is_platform_admin());
create policy driving_schools_update on public.driving_schools for update to authenticated using (id = app.current_tenant_id() and app.is_admin()) with check (id = app.current_tenant_id() and app.is_admin());

call app.policy_tenant_select('locations');
call app.policy_tenant_write('locations', 'app.is_admin()');

create policy users_select_self on public.users for select to authenticated using (id = auth.uid());
create policy users_select_tenant on public.users for select to authenticated using (
  exists (select 1 from public.tenant_memberships m where m.user_id = users.id and m.tenant_id = app.current_tenant_id() and m.status = 'active')
  and (app.is_staff() or exists (select 1 from public.tenant_memberships m2 where m2.user_id = users.id and m2.tenant_id = app.current_tenant_id() and m2.role <> 'student')));
create policy users_update_self on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and is_platform_admin = (select u.is_platform_admin from public.users u where u.id = auth.uid()));
create policy users_insert_self on public.users for insert to authenticated with check (id = auth.uid() and is_platform_admin = false);

create policy memberships_select on public.tenant_memberships for select to authenticated using (user_id = auth.uid() or (tenant_id = app.current_tenant_id() and app.is_staff()));
call app.policy_tenant_write('tenant_memberships', 'app.is_admin()');

-- Schüler, Fahrlehrer, Fahrzeuge ------------------------------------------------------------
call app.policy_tenant_select('students', 'app.is_staff() or user_id = auth.uid()');
call app.policy_tenant_write('students', 'app.is_office()');
call app.policy_tenant_select('instructors');
call app.policy_tenant_write('instructors', 'app.is_admin()');
call app.policy_tenant_select('vehicles');
call app.policy_tenant_write('vehicles', 'app.is_office()');
call app.policy_tenant_select('student_licenses', 'app.is_staff() or student_id = app.current_student_id()');
call app.policy_tenant_write('student_licenses', 'app.is_office()');

-- Referenzdaten und Regeln --------------------------------------------------------------------
create policy licenses_select on public.licenses for select to authenticated using (true);
create policy licenses_write on public.licenses for all to authenticated using (app.is_platform_admin()) with check (app.is_platform_admin());
create policy rule_versions_select on public.rule_versions for select to authenticated using (review_status = 'published' or app.is_platform_admin());
create policy rule_versions_write on public.rule_versions for all to authenticated using (app.is_platform_admin()) with check (app.is_platform_admin());
create policy skills_select on public.skills for select to authenticated using (true);
create policy skills_write on public.skills for all to authenticated using (app.is_platform_admin()) with check (app.is_platform_admin());
create policy badges_select on public.badges for select to authenticated using (true);
create policy badges_write on public.badges for all to authenticated using (app.is_platform_admin()) with check (app.is_platform_admin());

-- Inhalte (global + Tenant) -----------------------------------------------------------------
create policy topics_select on public.topics for select to authenticated using (tenant_id is null or tenant_id = app.current_tenant_id());
create policy topics_write on public.topics for all to authenticated using ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin())) with check ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin()));
call app.policy_content('theory_questions', 'status');
create policy question_versions_select on public.question_versions for select to authenticated using (
  exists (select 1 from public.theory_questions q where q.id = question_versions.question_id));
create policy question_versions_write on public.question_versions for all to authenticated using (
  exists (select 1 from public.theory_questions q where q.id = question_versions.question_id and ((q.tenant_id is null and app.is_platform_admin()) or (q.tenant_id = app.current_tenant_id() and app.is_admin()))))
  with check (exists (select 1 from public.theory_questions q where q.id = question_versions.question_id and ((q.tenant_id is null and app.is_platform_admin()) or (q.tenant_id = app.current_tenant_id() and app.is_admin()))));
create policy question_answers_select on public.question_answers for select to authenticated using (
  exists (select 1 from public.question_versions v where v.id = question_answers.question_version_id));
create policy question_answers_write on public.question_answers for all to authenticated using (
  exists (select 1 from public.question_versions v join public.theory_questions q on q.id = v.question_id where v.id = question_answers.question_version_id and ((q.tenant_id is null and app.is_platform_admin()) or (q.tenant_id = app.current_tenant_id() and app.is_admin()))))
  with check (exists (select 1 from public.question_versions v join public.theory_questions q on q.id = v.question_id where v.id = question_answers.question_version_id and ((q.tenant_id is null and app.is_platform_admin()) or (q.tenant_id = app.current_tenant_id() and app.is_admin()))));
call app.policy_content('knowledge_entries');
call app.policy_content('chapters');
call app.policy_content('practical_check_questions');
create policy content_reviews_select on public.content_reviews for select to authenticated using (app.is_platform_admin() or app.is_admin());
create policy content_reviews_insert on public.content_reviews for insert to authenticated with check (app.is_platform_admin() or app.is_admin());
create policy document_requirements_select on public.document_requirements for select to authenticated using (tenant_id is null or tenant_id = app.current_tenant_id());
create policy document_requirements_write on public.document_requirements for all to authenticated using ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin())) with check ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin()));

-- Lerndaten: Schüler schreibt eigene, Mitarbeiter lesen ---------------------------------------
create or replace procedure app.policy_student_owned(tbl text, allow_update boolean default true)
language plpgsql as $$
begin
  execute format('create policy %I on public.%I for select to authenticated using (tenant_id = app.current_tenant_id() and (student_id = app.current_student_id() or app.is_staff()))', tbl || '_select', tbl);
  execute format('create policy %I on public.%I for insert to authenticated with check (tenant_id = app.current_tenant_id() and student_id = app.current_student_id())', tbl || '_insert', tbl);
  if allow_update then
    execute format('create policy %I on public.%I for update to authenticated using (tenant_id = app.current_tenant_id() and student_id = app.current_student_id()) with check (tenant_id = app.current_tenant_id() and student_id = app.current_student_id())', tbl || '_update', tbl);
  end if;
end $$;
call app.policy_student_owned('learning_sessions');
call app.policy_student_owned('student_question_attempts', false);
call app.policy_student_owned('student_question_state');
call app.policy_student_owned('student_topic_mastery');
call app.policy_student_owned('exam_simulations');
create policy exam_results_select on public.exam_results for select to authenticated using (exists (select 1 from public.exam_simulations e where e.id = exam_results.exam_simulation_id));
create policy exam_results_insert on public.exam_results for insert to authenticated with check (exists (select 1 from public.exam_simulations e where e.id = exam_results.exam_simulation_id and e.student_id = app.current_student_id()));
create policy exam_results_update on public.exam_results for update to authenticated using (exists (select 1 from public.exam_simulations e where e.id = exam_results.exam_simulation_id and e.student_id = app.current_student_id() and e.status = 'in_progress'));
call app.policy_tenant_select('readiness_snapshots', 'app.is_staff() or exists (select 1 from public.student_licenses sl where sl.id = readiness_snapshots.student_license_id and sl.student_id = app.current_student_id())');
call app.policy_student_owned('daily_goals');
call app.policy_student_owned('xp_events', false);
call app.policy_student_owned('student_badges', false);
call app.policy_student_owned('student_streaks');
call app.policy_student_owned('coach_conversations', false);
create policy coach_messages_select on public.coach_messages for select to authenticated using (exists (select 1 from public.coach_conversations c where c.id = coach_messages.conversation_id));
create policy coach_messages_insert on public.coach_messages for insert to authenticated with check (role = 'user' and exists (select 1 from public.coach_conversations c where c.id = coach_messages.conversation_id and c.student_id = app.current_student_id()));

-- Ausbildung, Termine -----------------------------------------------------------------------
call app.policy_tenant_select('student_skill_scores', 'app.is_staff() or exists (select 1 from public.student_licenses sl where sl.id = student_skill_scores.student_license_id and sl.student_id = app.current_student_id())');
create policy sss_insert on public.student_skill_scores for insert to authenticated with check (tenant_id = app.current_tenant_id() and app.is_staff() and (instructor_id = app.current_instructor_id() or app.is_office()));
call app.policy_tenant_select('instructor_availability');
create policy instructor_availability_write on public.instructor_availability for all to authenticated using (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id())) with check (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()));
call app.policy_tenant_select('instructor_absences', 'app.is_staff()');
create policy instructor_absences_write on public.instructor_absences for all to authenticated using (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id())) with check (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()));
call app.policy_tenant_select('vehicle_blocks', 'app.is_staff()');
call app.policy_tenant_write('vehicle_blocks', 'app.is_office()');
-- Schüler sehen offene Slots und eigene Stunden, nie fremde Buchungen
call app.policy_tenant_select('lessons', 'app.is_staff() or status = ''open'' or student_id = app.current_student_id()');
create policy lessons_write on public.lessons for all to authenticated
  using (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()))
  with check (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()));
call app.policy_tenant_select('cancellation_policies');
call app.policy_tenant_write('cancellation_policies', 'app.is_admin()');
call app.policy_tenant_select('lesson_bookings', 'app.is_staff() or student_id = app.current_student_id()');
create policy lesson_bookings_insert_staff on public.lesson_bookings for insert to authenticated with check (tenant_id = app.current_tenant_id() and app.is_staff());
call app.policy_student_owned('waitlist_entries');
call app.policy_tenant_select('waitlist_offers', 'app.is_staff() or exists (select 1 from public.waitlist_entries w where w.id = waitlist_offers.waitlist_entry_id and w.student_id = app.current_student_id())');
create policy waitlist_offers_respond on public.waitlist_offers for update to authenticated using (tenant_id = app.current_tenant_id() and (app.is_staff() or exists (select 1 from public.waitlist_entries w where w.id = waitlist_offers.waitlist_entry_id and w.student_id = app.current_student_id())));
call app.policy_tenant_write('waitlist_offers', 'app.is_staff()');
call app.policy_tenant_select('lesson_evaluations', 'app.is_staff() or (shared_with_student and exists (select 1 from public.student_licenses sl where sl.id = lesson_evaluations.student_license_id and sl.student_id = app.current_student_id()))');
create policy lesson_evaluations_write on public.lesson_evaluations for all to authenticated
  using (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()))
  with check (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()));
call app.policy_tenant_select('theory_classes');
call app.policy_tenant_write('theory_classes', 'app.is_staff()');
call app.policy_tenant_select('theory_class_checkin_tokens', 'app.is_staff()');
create policy checkin_tokens_write on public.theory_class_checkin_tokens for insert to authenticated with check (tenant_id = app.current_tenant_id() and app.is_staff());
create policy checkin_tokens_update on public.theory_class_checkin_tokens for update to authenticated using (tenant_id = app.current_tenant_id() and app.is_staff());
call app.policy_tenant_select('attendance', 'app.is_staff() or student_id = app.current_student_id()');
call app.policy_tenant_write('attendance', 'app.is_staff()');
call app.policy_tenant_select('mock_exams', 'app.is_staff() or exists (select 1 from public.student_licenses sl where sl.id = mock_exams.student_license_id and sl.student_id = app.current_student_id())');
create policy mock_exams_write on public.mock_exams for all to authenticated using (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id())) with check (tenant_id = app.current_tenant_id() and (app.is_office() or instructor_id = app.current_instructor_id()));
create policy mock_exam_events_select on public.mock_exam_events for select to authenticated using (exists (select 1 from public.mock_exams m where m.id = mock_exam_events.mock_exam_id));
create policy mock_exam_events_write on public.mock_exam_events for all to authenticated using (exists (select 1 from public.mock_exams m where m.id = mock_exam_events.mock_exam_id and (app.is_office() or m.instructor_id = app.current_instructor_id()))) with check (exists (select 1 from public.mock_exams m where m.id = mock_exam_events.mock_exam_id and (app.is_office() or m.instructor_id = app.current_instructor_id())));
call app.policy_tenant_select('theory_exams', 'app.is_staff() or exists (select 1 from public.student_licenses sl where sl.id = theory_exams.student_license_id and sl.student_id = app.current_student_id())');
call app.policy_tenant_write('theory_exams', 'app.is_staff()');
call app.policy_tenant_select('practical_exams', 'app.is_staff() or exists (select 1 from public.student_licenses sl where sl.id = practical_exams.student_license_id and sl.student_id = app.current_student_id())');
call app.policy_tenant_write('practical_exams', 'app.is_staff()');

-- Finanzen ----------------------------------------------------------------------------------
call app.policy_tenant_select('price_lists');
call app.policy_tenant_write('price_lists', 'app.is_admin()');
create policy price_items_select on public.price_items for select to authenticated using (exists (select 1 from public.price_lists p where p.id = price_items.price_list_id));
create policy price_items_write on public.price_items for all to authenticated using (exists (select 1 from public.price_lists p where p.id = price_items.price_list_id and app.is_admin())) with check (exists (select 1 from public.price_lists p where p.id = price_items.price_list_id and app.is_admin()));
call app.policy_tenant_select('contracts', 'app.is_office() or student_id = app.current_student_id()');
call app.policy_tenant_write('contracts', 'app.is_office()');
call app.policy_tenant_select('invoices', 'app.is_office() or student_id = app.current_student_id()');
call app.policy_tenant_write('invoices', 'app.is_office()');
create policy invoice_items_select on public.invoice_items for select to authenticated using (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id));
create policy invoice_items_write on public.invoice_items for all to authenticated using (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and app.is_office() and i.status = 'draft')) with check (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and app.is_office() and i.status = 'draft'));
call app.policy_tenant_select('payment_mandates', 'app.is_office() or student_id = app.current_student_id()');
call app.policy_tenant_write('payment_mandates', 'app.is_office()');
call app.policy_tenant_select('payments', 'app.is_office() or student_id = app.current_student_id()');
call app.policy_tenant_write('payments', 'app.is_office()');

-- Dokumente, Einwilligungen, Benachrichtigungen, Nachrichten --------------------------------
call app.policy_tenant_select('documents', 'app.is_office() or student_id = app.current_student_id()');
create policy documents_insert on public.documents for insert to authenticated with check (tenant_id = app.current_tenant_id() and (app.is_office() or student_id = app.current_student_id()));
create policy documents_update on public.documents for update to authenticated using (tenant_id = app.current_tenant_id() and (app.is_office() or (student_id = app.current_student_id() and status in ('missing', 'rejected', 'uploaded')))) with check (tenant_id = app.current_tenant_id() and (app.is_office() or (student_id = app.current_student_id() and status in ('missing', 'uploaded'))));
create policy documents_delete on public.documents for delete to authenticated using (tenant_id = app.current_tenant_id() and app.is_office());
create policy consents_select on public.consents for select to authenticated using (user_id = auth.uid() or (tenant_id = app.current_tenant_id() and app.is_office()));
create policy consents_insert on public.consents for insert to authenticated with check (user_id = auth.uid() or (tenant_id = app.current_tenant_id() and app.is_office()));
create policy consents_update on public.consents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_all on public.notification_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_all on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy conversations_select on public.conversations for select to authenticated using (tenant_id = app.current_tenant_id() and (app.is_office() or exists (select 1 from public.conversation_participants p where p.conversation_id = conversations.id and p.user_id = auth.uid())));
call app.policy_tenant_write('conversations', 'true');
create policy participants_select on public.conversation_participants for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.conversations c where c.id = conversation_participants.conversation_id and app.is_office()) or exists (select 1 from public.conversation_participants p2 where p2.conversation_id = conversation_participants.conversation_id and p2.user_id = auth.uid()));
create policy participants_write on public.conversation_participants for all to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_participants.conversation_id and (app.is_office() or exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = auth.uid())))) with check (exists (select 1 from public.conversations c where c.id = conversation_participants.conversation_id));
create policy participants_update_self on public.conversation_participants for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy messages_select on public.messages for select to authenticated using (tenant_id = app.current_tenant_id() and (exists (select 1 from public.conversation_participants p where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()) or app.is_office()));
create policy messages_insert on public.messages for insert to authenticated with check (tenant_id = app.current_tenant_id() and sender_id = auth.uid() and exists (select 1 from public.conversation_participants p where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()));
create policy messages_update_own on public.messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- Audit, DSGVO, Aufbewahrung -----------------------------------------------------------------
create policy audit_logs_select on public.audit_logs for select to authenticated using (tenant_id = app.current_tenant_id() and app.is_admin());
create policy data_requests_select on public.data_requests for select to authenticated using (user_id = auth.uid() or (tenant_id = app.current_tenant_id() and app.is_office()));
create policy data_requests_insert on public.data_requests for insert to authenticated with check (user_id = auth.uid());
create policy data_requests_update on public.data_requests for update to authenticated using (tenant_id = app.current_tenant_id() and app.is_office()) with check (tenant_id = app.current_tenant_id() and app.is_office());
create policy retention_policies_select on public.retention_policies for select to authenticated using (tenant_id is null or tenant_id = app.current_tenant_id());
create policy retention_policies_write on public.retention_policies for all to authenticated using ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin())) with check ((tenant_id is null and app.is_platform_admin()) or (tenant_id = app.current_tenant_id() and app.is_admin()));
