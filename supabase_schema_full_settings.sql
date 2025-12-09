-- Run this in Supabase SQL Editor to ensure all columns exist
-- This is critical for saving settings and profiles

-- 1. Equipment Profile & Whitelist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS user_equipment_profile TEXT,
ADD COLUMN IF NOT EXISTS available_exercise_names JSONB DEFAULT '[]'::jsonb;

-- 2. OpenAI Key
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

-- 3. Custom Exercises
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS custom_exercises JSONB DEFAULT '[]'::jsonb;

-- 4. Excluded Exercises
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS excluded_exercises JSONB DEFAULT '[]'::jsonb;

-- 5. Include Legs (Already requested, but good to include)
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS include_legs BOOLEAN DEFAULT true;

-- 6. Favorites
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS favorites JSONB DEFAULT '[]'::jsonb;
