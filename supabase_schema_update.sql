-- Add focus_area column to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS focus_area TEXT DEFAULT 'Default';

-- Add focus_area column to workout_history
ALTER TABLE workout_history 
ADD COLUMN IF NOT EXISTS focus_area TEXT DEFAULT 'Default';

-- Comment: This update is required for the new Focus Area feature to work and for settings to load correctly.
