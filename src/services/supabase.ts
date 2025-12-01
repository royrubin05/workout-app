import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase URL or Key. Persistence will be disabled.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
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
