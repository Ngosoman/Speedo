create extension if not exists pgcrypto;

create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_number integer not null unique,
  client_code text not null unique,
  full_name text not null,
  email text not null unique,
  phone text not null,
  date_of_birth date,
  license_number text,
  license_expiry date,
  residential_address text,
  work_address text,
  kra_pin text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model text,
  owner_id uuid references owners(id) on delete set null,
  daily_price numeric(12,2) not null,
  photo_url text,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  car_id uuid not null references cars(id) on delete restrict,
  pickup_location text not null,
  dropoff_location text not null,
  pickup_datetime timestamptz not null,
  return_datetime timestamptz not null,
  number_of_days integer not null check (number_of_days > 0),
  driver_required text not null default 'No',
  notes text,
  status text not null default 'pending',
  admin_notes text,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists damage_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  car_id uuid not null references cars(id) on delete cascade,
  damage_cost numeric(12,2) not null,
  notes text,
  reported_at timestamptz not null default now()
);

create table if not exists blacklist_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  car_id uuid references cars(id) on delete set null,
  reason text not null,
  status text not null default 'blacklisted',
  created_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  contract_type text not null,
  party_a text not null,
  party_b text not null,
  contract_text text not null,
  generated_at timestamptz not null default now(),
  status text not null default 'generated'
);

create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_client_id on bookings(client_id);
create index if not exists idx_cars_owner_id on cars(owner_id);
create index if not exists idx_blacklist_client_id on blacklist_entries(client_id);

-- Storage bucket for car photos (run once; ignore if already exists)
insert into storage.buckets (id, name, public)
values ('cars', 'cars', true)
on conflict (id) do nothing;
