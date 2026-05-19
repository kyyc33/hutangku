create table incomes (
  id uuid default gen_random_uuid() primary key,
  date text,
  jobname text,
  client text,
  category text,
  amount bigint,
  status text,
  note text
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  date text,
  category text,
  amount bigint,
  note text
);

create table debts (
  id uuid default gen_random_uuid() primary key,
  name text,
  total bigint,
  paid bigint
);
