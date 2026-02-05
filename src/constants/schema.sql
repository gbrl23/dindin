-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  is_owner boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CARDS
create table cards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  closing_day integer,
  due_day integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  amount numeric not null,
  date date not null,
  card text, -- storing name for simplicity in migration, could be FK
  installments integer default 1,
  split jsonb, -- Storing the split array as JSONB for flexibility
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BILLS
create table bills (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  amount numeric not null,
  due_date date,
  is_paid boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) - OPEN FOR NOW (Since we use Anon Key without Auth context yet)
alter table profiles enable row level security;
alter table cards enable row level security;
alter table transactions enable row level security;
alter table bills enable row level security;

create policy "Enable all access for now" on profiles for all using (true);
create policy "Enable all access for now" on cards for all using (true);
create policy "Enable all access for now" on transactions for all using (true);
create policy "Enable all access for now" on bills for all using (true);
