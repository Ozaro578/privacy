-- 0018: Härtung. Berechnete Lernergebnisse (Versuche, Zustände, Simulationen, XP, Serien, Abzeichen, Tagesziele) schreibt
--       ausschließlich der Server (Service-Role) nach Prüfung; Schüler lesen nur. Chat-Teilnahme nur an eigenen Unterhaltungen.
do $$ declare t text; begin
  foreach t in array array['learning_sessions','student_question_attempts','student_question_state','student_topic_mastery','exam_simulations','daily_goals','xp_events','student_badges','student_streaks']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
  end loop;
end $$;
drop policy if exists exam_results_insert on public.exam_results;
drop policy if exists exam_results_update on public.exam_results;
-- Merken-Flag darf der Schüler weiterhin selbst setzen (nur diese Spalte, per Funktion)
create or replace function public.set_question_bookmark(p_question_id uuid, p_bookmarked boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_student uuid; v_tenant uuid;
begin
  v_student = app.current_student_id(); v_tenant = app.current_tenant_id();
  if v_student is null then raise exception 'Nur Schüler' using errcode = '42501'; end if;
  insert into public.student_question_state (tenant_id, student_id, question_id, bookmarked)
    values (v_tenant, v_student, p_question_id, p_bookmarked)
    on conflict (student_id, question_id) do update set bookmarked = excluded.bookmarked;
  return p_bookmarked;
end $$;
grant execute on function public.set_question_bookmark(uuid, boolean) to authenticated;

-- Chat: Policies ohne wechselseitige Verweise (Rekursion). Hilfsfunktionen lesen mit Definer-Rechten.
create or replace function app.is_conversation_member(p_conversation uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_participants p where p.conversation_id = p_conversation and p.user_id = auth.uid())
$$;
create or replace function app.conversation_info(p_conversation uuid, out tenant_id uuid, out kind text, out student_id uuid)
language sql stable security definer set search_path = public as $$
  select c.tenant_id, c.kind, c.student_id from public.conversations c where c.id = p_conversation
$$;
grant execute on function app.is_conversation_member(uuid), app.conversation_info(uuid) to authenticated, service_role;

drop policy if exists conversations_select on public.conversations;
drop policy if exists conversations_insert on public.conversations;
drop policy if exists conversations_update on public.conversations;
drop policy if exists conversations_delete on public.conversations;
create policy conversations_select on public.conversations for select to authenticated
  using (tenant_id = app.current_tenant_id() and (app.is_office() or app.is_conversation_member(id)));
create policy conversations_insert on public.conversations for insert to authenticated
  with check (tenant_id = app.current_tenant_id() and (app.is_staff() or (student_id = app.current_student_id() and kind in ('student_instructor', 'student_office'))));
create policy conversations_update on public.conversations for update to authenticated
  using (tenant_id = app.current_tenant_id() and (app.is_office() or app.is_conversation_member(id)));

drop policy if exists participants_select on public.conversation_participants;
drop policy if exists participants_write on public.conversation_participants;
drop policy if exists participants_update_self on public.conversation_participants;
create policy participants_select on public.conversation_participants for select to authenticated
  using (user_id = auth.uid() or app.is_conversation_member(conversation_id) or (app.is_office() and (app.conversation_info(conversation_id)).tenant_id = app.current_tenant_id()));
create policy participants_insert on public.conversation_participants for insert to authenticated
  with check ((app.conversation_info(conversation_id)).tenant_id = app.current_tenant_id() and (
      app.is_office()
      or ((app.conversation_info(conversation_id)).student_id = app.current_student_id() and (user_id = auth.uid()
          or exists (select 1 from public.tenant_memberships m where m.user_id = conversation_participants.user_id and m.tenant_id = app.current_tenant_id() and m.role <> 'student' and m.status = 'active')))
      or (app.is_staff() and user_id = auth.uid() and ((app.conversation_info(conversation_id)).kind = 'staff'
          or exists (select 1 from public.student_licenses sl where sl.student_id = (app.conversation_info(conversation_id)).student_id and sl.primary_instructor_id = app.current_instructor_id())))));
create policy participants_update_self on public.conversation_participants for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy participants_delete on public.conversation_participants for delete to authenticated
  using (user_id = auth.uid() or (app.is_office() and (app.conversation_info(conversation_id)).tenant_id = app.current_tenant_id()));

drop policy if exists messages_select on public.messages;
drop policy if exists messages_insert on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (tenant_id = app.current_tenant_id() and (app.is_office() or app.is_conversation_member(conversation_id)));
create policy messages_insert on public.messages for insert to authenticated
  with check (tenant_id = app.current_tenant_id() and sender_id = auth.uid() and app.is_conversation_member(conversation_id));

-- Benachrichtigung an die anderen Teilnehmer beim Senden (Schüler dürfen notifications nicht direkt schreiben)
create or replace function public.notify_conversation(p_conversation_id uuid, p_preview text) returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0; v_tenant uuid;
begin
  if not exists (select 1 from public.conversation_participants p where p.conversation_id = p_conversation_id and p.user_id = auth.uid()) then
    raise exception 'Keine Teilnahme an dieser Unterhaltung' using errcode = '42501';
  end if;
  select tenant_id into v_tenant from public.conversations where id = p_conversation_id;
  insert into public.notifications (tenant_id, user_id, notification_type, title, body, data, channels, dedupe_key)
    select v_tenant, p.user_id, 'message_received', 'Neue Nachricht', left(p_preview, 120), jsonb_build_object('conversation_id', p_conversation_id), '{push,in_app}', 'msg:' || p_conversation_id || ':' || extract(epoch from now())::bigint
    from public.conversation_participants p where p.conversation_id = p_conversation_id and p.user_id <> auth.uid()
    on conflict do nothing;
  get diagnostics v_count = row_count;
  update public.conversations set last_message_at = now() where id = p_conversation_id;
  update public.conversation_participants set last_read_at = now() where conversation_id = p_conversation_id and user_id = auth.uid();
  return v_count;
end $$;
grant execute on function public.notify_conversation(uuid, text) to authenticated;
