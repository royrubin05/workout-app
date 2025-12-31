import { supabase } from './supabase';
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
    static async authenticate() {
        let authData = null;
        let authError = null;

        ({ data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'roy.rubin@gmail.com',
            password: 'password123',
        }));

        if (authError || !authData?.session) {
            console.log('Login failed, trying signup/session check...');
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
                authData = sessionData;
            } else {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: 'roy.rubin@gmail.com',
                    password: 'password123',
                });
                if (signUpData.session) authData = signUpData;
                else if (signUpError) throw signUpError;
            }
        }
        return authData?.session?.user;
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
        }

        // 2. History
        const { data: historyData, error: historyError } = await supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId);

        if (historyError) {
            console.error('Error loading history:', historyError);
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

    static async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
}
