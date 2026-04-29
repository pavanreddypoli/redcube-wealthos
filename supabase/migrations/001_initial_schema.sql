-- RedCube WealthOS — Initial Schema
-- Run this in your Supabase SQL editor or via supabase db push

create extension if not exists "uuid-ossp";

-- ─── Firms (top-level tenant) ─────────────────────────────────────────────────

create table firms (
  id                     uuid primary key default uuid_generate_v4(),
  name                   text not null,
  plan                   text not null default 'free',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text default 'trialing',
  trial_ends_at          timestamptz default now() + interval '14 days',
  created_at             timestamptz default now()
);

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  firm_id    uuid references firms(id) on delete set null,
  email      text not null,
  full_name  text,
  firm_name  text,
  role       text default 'advisor',
  plan       text default 'free',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Assessments ─────────────────────────────────────────────────────────────

create table assessments (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references auth.users(id) on delete set null,
  answers                 jsonb not null,
  score                   integer not null,
  risk_profile            text not null,
  recommended_allocation  jsonb not null,
  created_at              timestamptz default now()
);

-- ─── Clients ─────────────────────────────────────────────────────────────────

create table clients (
  id             uuid primary key default uuid_generate_v4(),
  firm_id        uuid references firms(id) on delete cascade,
  advisor_id     uuid references auth.users(id) on delete set null,
  full_name      text not null,
  email          text,
  risk_profile   text default 'moderate',
  aum_dollars    bigint default 0,
  date_of_birth  date,
  retirement_age integer,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── Compliance items ─────────────────────────────────────────────────────────

create table compliance_items (
  id          uuid primary key default uuid_generate_v4(),
  firm_id     uuid references firms(id) on delete cascade,
  client_id   uuid references clients(id) on delete cascade,
  category    text not null,
  title       text not null,
  description text,
  status      text default 'open',
  due_date    date,
  created_at  timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table profiles         enable row level security;
alter table assessments      enable row level security;
alter table clients          enable row level security;
alter table compliance_items enable row level security;

-- Profiles: users see only their own
create policy "own_profile" on profiles
  for all using (id = auth.uid());

-- Assessments: users see only their own (or anonymous if user_id is null)
create policy "own_assessments" on assessments
  for all using (user_id = auth.uid() or user_id is null);

-- Clients: advisors see clients in their firm
create policy "firm_clients" on clients
  for all using (
    firm_id in (
      select firm_id from profiles where id = auth.uid()
    )
  );

-- Compliance: same firm scoping
create policy "firm_compliance" on compliance_items
  for all using (
    firm_id in (
      select firm_id from profiles where id = auth.uid()
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index idx_assessments_user    on assessments (user_id);
create index idx_clients_firm        on clients     (firm_id);
create index idx_clients_advisor     on clients     (advisor_id);
create index idx_compliance_firm     on compliance_items (firm_id);
create index idx_compliance_client   on compliance_items (client_id);
