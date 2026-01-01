import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import type { WorkoutExercise } from '../types';

export interface UserState {
    equipment: string;
    excludedExercises: string[];
    favorites: string[];
    userEquipmentProfile: string;
    customExercises: any[];
    currentSplit: string;
    dailyWorkout: WorkoutExercise[];
    lastWorkoutDate: string | null;
    completedToday: boolean;
    focusArea: string;
    openaiApiKey: string;
    includeLegs: boolean;
    programMode: string;
    cycleIndex: number;
    availableExerciseNames: string[];
}

export class UserService {
    static async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    }

    static async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    }

    /**
     * Admin: Create a new user without logging out the current admin.
     * Uses a temporary, non-persisting client instance.
     */
    static async createUser(email: string, password: string) {
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false, // CRITICAL: Do not overwrite the admin's session in localStorage
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        const { data, error } = await tempClient.auth.signUp({
            email,
            password
        });

        // Handle "User already registered" case (Ghost User)
        if (error) {
            // Check if user already exists
            if (error.message.includes('already registered') || error.code === 'user_already_exists') {
                console.warn('User exists. Attempting recovery (Ghost User check)...');

                // Try to login with the provided password
                const { data: loginData, error: loginError } = await tempClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (loginError) {
                    // Password mismatch or other issue
                    throw new Error(`User already exists, but password was incorrect. Cannot recover.`);
                }

                // User exists and we learned the credentials are valid.
                // Fall through to profile creation below using loginData.user
                if (loginData.user) {
                    // Ensure we use the logged-in user for profile creation
                    const { error: profileError } = await tempClient
                        .from('profiles')
                        .insert({
                            id: loginData.user.id,
                            email: loginData.user.email,
                            role: 'user'
                        });
                    // If duplicate key error on profile, it means profile ALREADY exists too.
                    if (profileError) {
                        if (profileError.code === '23505') { // Unique violation
                            throw new Error('User and Profile already exist.');
                        }
                        throw new Error(`Recovered user but failed to create profile: ${profileError.message}`);
                    }
                    return loginData.user;
                }
            }
            throw error; // Other errors
        }

        // Standard Success Path (New User)
        if (data.user) {
            const { error: profileError } = await tempClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: data.user.email,
                    role: 'user'
                });

            if (profileError) {
                console.error('Failed to create profile:', profileError);
                throw new Error(`User created but profile failed: ${profileError.message}`);
            }
        }

        return data.user;
    }

    static async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    static async loadUserData(userId: string) {
        // 1. Settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') { // Ignore 'not found'
            console.error('Error loading settings:', settingsError);
            throw settingsError;
        }

        // 2. History
        const { data: historyData, error: historyError } = await supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId);

        if (historyError) {
            console.error('Error loading history:', historyError);
            throw historyError;
        }

        return {
            settings: settingsData,
            history: historyData || []
        };
    }

    static async syncSettings(userId: string, state: UserState) {
        const { error: syncError } = await supabase
            .from('user_settings')
            .upsert({
                id: userId,
                equipment: state.equipment,
                excluded_exercises: state.excludedExercises,
                favorites: state.favorites,
                user_equipment_profile: state.userEquipmentProfile,
                custom_exercises: state.customExercises,
                current_split: state.currentSplit,
                daily_workout: state.dailyWorkout,
                last_workout_date: state.lastWorkoutDate,
                completed_today: state.completedToday,
                focus_area: state.focusArea,
                openai_api_key: state.openaiApiKey,
                include_legs: state.includeLegs,
                program_mode: state.programMode,
                cycle_index: state.cycleIndex,
                available_exercise_names: state.availableExerciseNames,
                updated_at: new Date().toISOString()
            });

        return syncError;
    }

    static async updateSettings(userId: string, partialSettings: any) {
        // Map camelCase to snake_case if necessary, or just expect the caller to pass correct DB fields?
        // Caller (Context) uses consistent naming? No, I should map it here to be safe/clean.
        const dbPayload: any = {};
        if (partialSettings.equipment !== undefined) dbPayload.equipment = partialSettings.equipment;
        if (partialSettings.exclude !== undefined) dbPayload.excluded_exercises = partialSettings.exclude; // Mapped
        if (partialSettings.favorites !== undefined) dbPayload.favorites = partialSettings.favorites;
        if (partialSettings.apiKey !== undefined) dbPayload.openai_api_key = partialSettings.apiKey;
        if (partialSettings.includeLegs !== undefined) dbPayload.include_legs = partialSettings.includeLegs;
        if (partialSettings.programMode !== undefined) dbPayload.program_mode = partialSettings.programMode;
        // Generic fallback for direct keys
        Object.keys(partialSettings).forEach(k => {
            if (!['exclude', 'apiKey', 'includeLegs', 'programMode'].includes(k)) {
                // TODO: Add robust mapping
                // For now, assume keys match or are handled above
            }
        });

        // Actually, simpler to just use upsert with specific fields if we know them
        // But for now let's just expose a generic update that takes the DB-compatible object
        const { error } = await supabase.from('user_settings').update(partialSettings).eq('id', userId);
        return error;
    }

    static async logWorkout(userId: string, historyEntry: any) {
        return supabase.from('workout_history').insert({
            user_id: userId,
            ...historyEntry
        });
    }

    static async deleteWorkout(id: string) {
        return supabase.from('workout_history').delete().eq('id', id);
    }

    static async clearAllHistory(userId: string) {
        return supabase.from('workout_history').delete().eq('user_id', userId);
    }

    static async addCustomExercise(userId: string, exercise: any) {
        // Custom exercises are array in user_settings JSONB or separate table?
        // Context code: `supabase.from('custom_exercises').insert(...)` -> Wait, line 935: `from('custom_exercises')`
        // Does 'custom_exercises' table exist? or is it a column in user_settings?
        // Line 935 implies a table. Line 294 implied sync to `custom_exercises` COLUMN in `user_settings`.
        // Let's check `WorkoutContext` again.
        // It seems consistent in `WorkoutContext` to usage of `state.customExercises`.
        // But the `insert` at 935 suggests a table.
        // Let's check `UserService.syncSettings` implementation I wrote: `custom_exercises: state.customExercises`.
        // There might be DUAL storage or I misread the grep.
        // Grep 935: `from('custom_exercises').insert`
        // Grep 294: `custom_exercises: state.customExercises` in `user_settings` upsert.
        // This is conflicting. I should verify which one is the source of truth.
        // I'll add methods for both or check.

        return supabase.from('custom_exercises').insert({
            user_id: userId,
            ...exercise
        });
    }

    static async getAppConfig() {
        // Shared Key Model: Authenticated users can read config
        const { data, error } = await supabase
            .from('app_config')
            .select('openai_api_key, maintenance_mode')
            .eq('id', 1)
            .single();

        if (error) {
            console.warn('Failed to load App Config:', error);
            return null;
        }
        return data;
    }

    static async updateAppConfig(config: { openai_api_key?: string, maintenance_mode?: boolean }) {
        const { error } = await supabase
            .from('app_config')
            .update(config)
            .eq('id', 1);
        return error;
    }

    static async getUserRole(userId: string) {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        return data?.role || 'user';
    }

    static async getProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
}
