import { createClient } from '@supabase/supabase-js';

// Force hardcoded values to rule out Vercel Env Var issues
// Force hardcoded values to rule out Vercel Env Var issues
export const supabaseUrl = 'https://abtxrknyybuxsnepnvmy.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidHhya255eWJ1eHNuZXBudm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU2MTYsImV4cCI6MjA4MDE4MTYxNn0.EpIDZbCulRyuCh4M2Jw9MQQ3GbmxAqXROghVZleqST0';

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

export interface UserSettings {
    id?: string; // usually user_id
    equipment: string;
    updated_at?: string;
}

export interface WorkoutLog {
    id?: string;
    date: string;
    exercises: any; // JSON
    split: string;
}
