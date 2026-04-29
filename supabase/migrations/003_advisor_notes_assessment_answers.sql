-- RedCube WealthOS — Migration 003
-- Adds: assessment_answers, advisor_notes tables
-- Also patches assessments with columns the app expects but migration 001 omitted

-- ─── Patch assessments table (safe — no-ops if columns already exist) ─────────

alter table assessments
  add column if not exists full_name          text,
  add column if not exists email              text,
  add column if not exists status             text default 'submitted',
  add column if not exists assigned_advisor_id uuid references auth.users(id) on delete set null;

-- ─── assessment_answers ───────────────────────────────────────────────────────
-- Stores per-section answer payloads linked to a parent assessment.
-- Sections: personal | cashflow | protection | retirement |
--           investments | mortgage | tax | estate | priorities

create table if not exists assessment_answers (
  id            uuid        primary key default uuid_generate_v4(),
  assessment_id uuid        not null references assessments(id) on delete cascade,
  section       text        not null
                            check (section in (
                              'personal','cashflow','protection','retirement',
                              'investments','mortgage','tax','estate','priorities'
                            )),
  answers       jsonb       not null,
  created_at    timestamptz default now()
);

alter table assessment_answers enable row level security;

-- Inherit visibility from the parent assessment
create policy "assessment_answers_visible" on assessment_answers
  for all using (
    assessment_id in (
      select id from assessments
      where user_id = auth.uid() or user_id is null
    )
  );

-- ─── advisor_notes ────────────────────────────────────────────────────────────
-- Advisor-authored notes attached to a client and/or an assessment.
-- At least one of client_id / assessment_id must be set.

create table if not exists advisor_notes (
  id            uuid        primary key default uuid_generate_v4(),
  advisor_id    uuid        not null references auth.users(id) on delete cascade,
  client_id     uuid        references clients(id)      on delete set null,
  assessment_id uuid        references assessments(id)  on delete set null,
  title         text,
  body          text        not null,
  is_private    boolean     not null default true,
  tags          text[]      not null default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  constraint notes_has_context
    check (client_id is not null or assessment_id is not null)
);

alter table advisor_notes enable row level security;

-- Advisors see their own notes; firm colleagues see non-private notes
create policy "advisor_notes_visible" on advisor_notes
  for all using (
    advisor_id = auth.uid()
    or (
      is_private = false
      and advisor_id in (
        select p2.id from profiles p2
        where p2.firm_id = (
          select firm_id from profiles where id = auth.uid()
        )
      )
    )
  );

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger advisor_notes_updated_at
  before update on advisor_notes
  for each row execute procedure set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_assessment_answers_assessment on assessment_answers (assessment_id);
create index if not exists idx_assessment_answers_section    on assessment_answers (section);

create index if not exists idx_advisor_notes_advisor    on advisor_notes (advisor_id);
create index if not exists idx_advisor_notes_client     on advisor_notes (client_id);
create index if not exists idx_advisor_notes_assessment on advisor_notes (assessment_id);
