-- Create a table for user settings (equipment)
create table user_settings (
  id uuid references auth.users not null primary key,
  equipment text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create a table for workout history
create table workout_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date timestamp with time zone default timezone('utc'::text, now()),
  exercises jsonb,
  split text
);

-- Set up Row Level Security (RLS)
alter table user_settings enable row level security;
alter table workout_history enable row level security;

create policy "Users can view their own settings" on user_settings
  for select using (auth.uid() = id);

create policy "Users can update their own settings" on user_settings
  for insert with check (auth.uid() = id);

create policy "Users can update their own settings update" on user_settings
  for update using (auth.uid() = id);

create policy "Users can view their own history" on workout_history
  for select using (auth.uid() = user_id);

create policy "Users can insert their own history" on workout_history
  for insert with check (auth.uid() = user_id);
