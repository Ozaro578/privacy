-- 0007: Preise, Verträge, Rechnungen (lückenlose Nummern), Zahlungen, SEPA-Mandate, Mahnwesen,
--       Dokumente und Checklisten, Einwilligungen, Benachrichtigungen, Nachrichten, Audit-Log, DSGVO-Anfragen
create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  name text not null,
  license_code text references public.licenses(code),
  valid_from date not null default current_date,
  valid_until date,
  vat_rate numeric(5,2) not null default 19.00,
  created_at timestamptz not null default now()
);
create index price_lists_tenant_idx on public.price_lists(tenant_id, valid_from desc);
create trigger trg_price_lists_tenant before insert or update on public.price_lists for each row execute function app.enforce_tenant_on_write();

create table public.price_items (
  id uuid primary key default gen_random_uuid(),
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  code text not null,                       -- base_fee, lesson_practice, lesson_overland, lesson_motorway, lesson_night, exam_theory_presentation, exam_practical_presentation, material, cancellation_fee
  name text not null,
  unit text not null default 'each' check (unit in ('each', 'unit45', 'hour')),
  amount_cents integer not null check (amount_cents >= 0),
  lesson_kind app.lesson_kind,
  unique (price_list_id, code)
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  price_list_id uuid references public.price_lists(id),
  cancellation_policy_id uuid references public.cancellation_policies(id),
  contract_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'active', 'terminated', 'completed')),
  signed_at timestamptz,
  signature_method text check (signature_method in ('on_paper', 'simple_electronic', 'advanced_electronic', 'qualified_electronic')),
  signature_evidence jsonb,                 -- Nachweisdaten des Signaturprozesses (Anbieter, Zeitstempel, Hash)
  document_path text,
  terms_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contracts_student_idx on public.contracts(student_id);
create trigger trg_contracts_updated before update on public.contracts for each row execute function app.set_updated_at();
create trigger trg_contracts_tenant before insert or update on public.contracts for each row execute function app.enforce_tenant_on_write();
alter table public.student_licenses add constraint student_licenses_contract_fk foreign key (contract_id) references public.contracts(id) on delete set null;

-- Lückenlose Rechnungsnummern je Tenant und Jahr (GoBD): Zähler-Tabelle mit Zeilensperre
create table public.invoice_counters (
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  year integer not null,
  last_number integer not null default 0,
  primary key (tenant_id, year)
);

create or replace function app.next_invoice_number(p_tenant uuid, p_year integer) returns text
language plpgsql security definer set search_path = public as $$
declare v_next integer; v_prefix text;
begin
  insert into public.invoice_counters(tenant_id, year, last_number) values (p_tenant, p_year, 0)
    on conflict (tenant_id, year) do nothing;
  update public.invoice_counters set last_number = last_number + 1
    where tenant_id = p_tenant and year = p_year returning last_number into v_next;
  select invoice_number_prefix into v_prefix from public.driving_schools where id = p_tenant;
  return format('%s-%s-%s', coalesce(v_prefix, 'RE'), p_year, lpad(v_next::text, 5, '0'));
end $$;

create type app.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'credited');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  invoice_number text,                      -- wird beim Ausstellen vergeben, danach unveränderlich
  status app.invoice_status not null default 'draft',
  issued_at date,
  due_at date,
  currency char(3) not null default 'EUR',
  net_cents integer not null default 0,
  vat_cents integer not null default 0,
  gross_cents integer not null default 0,
  paid_cents integer not null default 0,
  vat_rate numeric(5,2) not null default 19.00,
  dunning_level smallint not null default 0 check (dunning_level between 0 and 3),
  dunning_last_at date,
  pdf_path text,
  e_invoice_path text,                      -- XRechnung/ZUGFeRD (B2B), optional
  credit_note_for uuid references public.invoices(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, invoice_number),
  check (status = 'draft' or invoice_number is not null)
);
create index invoices_student_idx on public.invoices(student_id, issued_at desc);
create index invoices_tenant_status_idx on public.invoices(tenant_id, status);
create trigger trg_invoices_updated before update on public.invoices for each row execute function app.set_updated_at();
create trigger trg_invoices_tenant before insert or update on public.invoices for each row execute function app.enforce_tenant_on_write();

-- Ausgestellte Rechnungen sind unveränderlich (nur Status/Zahlungsfelder/Mahnung dürfen sich ändern)
create or replace function app.protect_issued_invoice() returns trigger
language plpgsql as $$
begin
  if old.status <> 'draft' then
    if new.invoice_number is distinct from old.invoice_number or new.net_cents <> old.net_cents
       or new.vat_cents <> old.vat_cents or new.gross_cents <> old.gross_cents or new.student_id <> old.student_id
       or new.issued_at is distinct from old.issued_at then
      raise exception 'Ausgestellte Rechnung % darf nicht verändert werden (Storno/Gutschrift verwenden)', old.invoice_number using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger trg_invoices_protect before update on public.invoices for each row execute function app.protect_issued_invoice();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  position smallint not null,
  description text not null,
  quantity numeric(8,2) not null default 1 check (quantity > 0),
  unit_net_cents integer not null check (unit_net_cents >= 0),
  vat_rate numeric(5,2) not null default 19.00,
  lesson_id uuid references public.lessons(id) on delete set null,
  price_item_code text,
  unique (invoice_id, position)
);
alter table public.theory_exams add constraint theory_exams_fee_item_fk foreign key (fee_invoice_item_id) references public.invoice_items(id) on delete set null;

create table public.payment_mandates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  provider text not null,                   -- stripe, gocardless, manual
  provider_mandate_id text,
  method text not null check (method in ('sepa_debit', 'card', 'bank_transfer', 'cash', 'other')),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'failed')),
  masked_iban text,                         -- nur maskiert; Volldaten verbleiben beim Zahlungsanbieter
  mandate_reference text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);
create index payment_mandates_student_idx on public.payment_mandates(student_id);
create trigger trg_payment_mandates_tenant before insert or update on public.payment_mandates for each row execute function app.enforce_tenant_on_write();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  mandate_id uuid references public.payment_mandates(id) on delete set null,
  provider text not null default 'manual',
  provider_payment_id text,
  method text not null check (method in ('sepa_debit', 'card', 'bank_transfer', 'cash', 'other')),
  amount_cents integer not null check (amount_cents <> 0),   -- negativ = Erstattung
  currency char(3) not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded', 'chargeback')),
  paid_at timestamptz,
  receipt_path text,
  webhook_event_id text unique,             -- Idempotenz für Zahlungsanbieter-Webhooks
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index payments_invoice_idx on public.payments(invoice_id);
create index payments_student_idx on public.payments(student_id, created_at desc);
create trigger trg_payments_tenant before insert or update on public.payments for each row execute function app.enforce_tenant_on_write();

-- Rechnungssaldo nach Zahlungsbuchung aktualisieren
create or replace function app.apply_payment_to_invoice() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_paid integer; v_gross integer; v_due date;
begin
  if new.invoice_id is null then return new; end if;
  select coalesce(sum(amount_cents), 0) into v_paid from public.payments where invoice_id = new.invoice_id and status = 'succeeded';
  select gross_cents, due_at into v_gross, v_due from public.invoices where id = new.invoice_id;
  update public.invoices set paid_cents = v_paid,
    status = case
      when status in ('cancelled', 'credited', 'draft') then status
      when v_paid >= v_gross then 'paid'::app.invoice_status
      when v_paid > 0 then 'partially_paid'::app.invoice_status
      when v_due is not null and v_due < current_date then 'overdue'::app.invoice_status
      else 'issued'::app.invoice_status end
  where id = new.invoice_id;
  return new;
end $$;
create trigger trg_payments_apply after insert or update of status, amount_cents on public.payments for each row execute function app.apply_payment_to_invoice();

-- Konfigurierbare Dokumenten-Checklisten je Fahrschule und Klasse
create table public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,   -- NULL = Plattform-Vorlage
  code text not null,                       -- registration, eye_test, first_aid, passport_photo, authority_application, id_copy, residence_proof, guardian_consent
  name_i18n jsonb not null,
  description_i18n jsonb not null default '{}'::jsonb,
  license_codes text[] not null default '{}',
  required boolean not null default true,
  requires_upload boolean not null default false,
  applies_when jsonb not null default '{}'::jsonb,   -- z. B. {"accompanied_driving": true}
  sort_order integer not null default 0,
  active boolean not null default true
);
create unique index document_requirements_global_idx on public.document_requirements(code) where tenant_id is null;
create unique index document_requirements_tenant_idx on public.document_requirements(tenant_id, code) where tenant_id is not null;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  requirement_code text,
  kind text not null,                       -- registration, eye_test, first_aid, passport_photo, contract, invoice, training_record, other
  title text not null,
  storage_path text,                        -- Supabase Storage (privater Bucket, RLS)
  mime_type text,
  size_bytes integer,
  status text not null default 'missing' check (status in ('missing', 'uploaded', 'verified', 'rejected', 'expired')),
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  rejection_reason text,
  expires_at date,
  uploaded_by uuid references public.users(id),
  retention_until date,                     -- Löschkonzept
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_student_idx on public.documents(student_id, kind);
create unique index documents_requirement_idx on public.documents(student_id, requirement_code) where requirement_code is not null;
create trigger trg_documents_updated before update on public.documents for each row execute function app.set_updated_at();
create trigger trg_documents_tenant before insert or update on public.documents for each row execute function app.enforce_tenant_on_write();

-- Einwilligungen (versionierte Texte, Widerruf nachvollziehbar)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  consent_type text not null,               -- privacy_policy, terms, marketing_email, ai_processing, photo_usage, push_notifications
  text_version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_hash text,
  user_agent text,
  evidence jsonb
);
create index consents_user_idx on public.consents(user_id, consent_type, granted_at desc);
create index consents_student_idx on public.consents(student_id, consent_type, granted_at desc);

-- Benachrichtigungen mit Präferenzen je Nutzer und Typ
create table public.notification_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type text not null,          -- lesson_reminder_24h, lesson_reminder_2h, earlier_slot, learn_reminder, exam_countdown, invoice_due, message, waitlist_offer, document_missing
  push boolean not null default true,
  email boolean not null default false,
  in_app boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  primary key (user_id, notification_type)
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('expo', 'fcm', 'apns', 'webpush')),
  token text not null,
  device_name text,
  locale text,
  last_seen_at timestamptz not null default now(),
  unique (provider, token)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  channels text[] not null default '{in_app}',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  dedupe_key text,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notifications_user_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index notifications_due_idx on public.notifications(scheduled_for) where sent_at is null;

-- In-App-Kommunikation: Konversationen Schüler <-> Fahrlehrer / Büro
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  kind text not null check (kind in ('student_instructor', 'student_office', 'staff')),
  student_id uuid references public.students(id) on delete cascade,
  subject text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index conversations_tenant_idx on public.conversations(tenant_id, last_message_at desc);
create trigger trg_conversations_tenant before insert or update on public.conversations for each row execute function app.enforce_tenant_on_write();

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  attachment_path text,
  client_message_id uuid,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique (conversation_id, client_message_id)
);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc);
create trigger trg_messages_tenant before insert or update on public.messages for each row execute function app.enforce_tenant_on_write();

-- Audit-Log (append-only, per Trigger befüllt)
create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid,
  actor_id uuid,
  actor_role text,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_table text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  changed_columns text[],
  request_id text,
  created_at timestamptz not null default now()
);
create index audit_logs_tenant_idx on public.audit_logs(tenant_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_table, entity_id, created_at desc);

create or replace function app.audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_old jsonb; v_new jsonb; v_changed text[]; v_tenant uuid; v_id text;
begin
  if tg_op = 'DELETE' then v_old = to_jsonb(old); else v_new = to_jsonb(new); end if;
  if tg_op = 'UPDATE' then
    v_old = to_jsonb(old);
    select array_agg(key) into v_changed from jsonb_each(v_new) n where n.value is distinct from (v_old -> n.key);
    if v_changed is null then return null; end if;
  end if;
  v_tenant = coalesce((coalesce(v_new, v_old) ->> 'tenant_id')::uuid, app.current_tenant_id());
  v_id = coalesce(v_new ->> 'id', v_old ->> 'id');
  -- Keine sensiblen Volltexte im Audit-Log
  v_old = v_old - 'notes_internal' - 'ai_transcript';
  v_new = v_new - 'notes_internal' - 'ai_transcript';
  insert into public.audit_logs(tenant_id, actor_id, actor_role, action, entity_table, entity_id, old_data, new_data, changed_columns, request_id)
  values (v_tenant, auth.uid(), coalesce(app.current_role()::text, auth.role()), lower(tg_op), tg_table_name, v_id, v_old, v_new, v_changed,
          nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id');
  return null;
end $$;

do $$ declare t text; begin
  foreach t in array array['students','student_licenses','instructors','vehicles','tenant_memberships','lessons','lesson_bookings',
    'lesson_evaluations','student_skill_scores','invoices','invoice_items','payments','payment_mandates','contracts','documents',
    'consents','theory_exams','practical_exams','rule_versions','theory_questions','question_versions','knowledge_entries',
    'cancellation_policies','driving_schools','locations','attendance']
  loop
    execute format('create trigger trg_audit_%s after insert or update or delete on public.%I for each row execute function app.audit_row_change()', t, t);
  end loop;
end $$;

-- DSGVO: Export- und Löschanfragen mit Bearbeitungsstatus
create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  kind text not null check (kind in ('export', 'deletion', 'rectification')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'rejected')),
  reason text,
  export_path text,
  handled_by uuid references public.users(id),
  completed_at timestamptz,
  legal_hold_until date,                    -- Aufbewahrungspflichten (z. B. Rechnungen 10 Jahre, Ausbildungsnachweise)
  created_at timestamptz not null default now()
);
create index data_requests_tenant_idx on public.data_requests(tenant_id, status);

-- Aufbewahrungsregeln je Datenart (konfigurierbar, Vorgaben zu verifizieren)
create table public.retention_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,
  data_category text not null,              -- invoices, training_records, learning_data, messages, audit_logs, documents
  retention_months integer not null check (retention_months >= 0),
  legal_basis text,
  review_status app.review_status not null default 'needs_verification',
  unique (tenant_id, data_category)
);
