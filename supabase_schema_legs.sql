-- Add include_legs column to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS include_legs BOOLEAN DEFAULT true;
