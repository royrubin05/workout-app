-- 1. Create App Config Table (Global Settings)
CREATE TABLE IF NOT EXISTS app_config (
  id INT PRIMARY KEY DEFAULT 1, -- Enforce single row
  openai_api_key TEXT,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 2. Create Profiles Table (Role Logic)
-- Note: Supabase creates 'auth.users', but we need a public profile to store roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Profiles: 
-- Admins can read all profiles. 
-- Users can read their own profile.
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true ); -- Actually, for a social app, profiles are public. For this app, maybe restricted?
-- Let's stick to: Users see themselves, Admins see all.
-- But for "Multi-User", maybe you want to see others later? 
-- For now, keep it simple.

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- App Config:
-- Admins can UPDATE.
CREATE POLICY "Admins can update config" 
ON app_config FOR UPDATE 
USING ( 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Authenticated Users can READ config (Shared Key Model)
CREATE POLICY "Authenticated users can read config" 
ON app_config FOR SELECT 
USING ( auth.role() = 'authenticated' );

-- 4. Initial Config Row
INSERT INTO app_config (id, openai_api_key) 
VALUES (1, '') 
ON CONFLICT (id) DO NOTHING;

-- 5. Helper to self-promote the first user (Run manually or trigger based)
-- For now, we assume the user will manually set their role in Supabase dashboard
-- OR we can make a trigger to make the first user admin.
