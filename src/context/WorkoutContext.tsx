import type { Exercise } from '../data/exercises';
import { EXERCISES } from '../data/exercises';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface WorkoutHistory {
    date: string;
    exercises: Exercise[];
}

interface WorkoutState {
    equipment: string;
    dailyWorkout: Exercise[];
    lastWorkoutDate: string | null;
    history: WorkoutHistory[];
    completedToday: boolean;
    currentSplit: 'Push' | 'Pull' | 'Legs' | 'Full Body';
}

interface WorkoutContextType extends WorkoutState {
    updateEquipment: (eq: string) => void;
    completeWorkout: () => void;
    refreshWorkout: () => void;
}

import { supabase } from '../services/supabase';

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<WorkoutState>({
        equipment: 'Bodyweight',
        dailyWorkout: [],
        lastWorkoutDate: null,
        history: [],
        completedToday: false,
        currentSplit: 'Push', // Default start
    });

    const [isLoaded, setIsLoaded] = useState(false);
    const [apiExercises, setApiExercises] = useState<Exercise[]>([]);
    const [user, setUser] = useState<any>(null);

    // Initialize
    useEffect(() => {
        const init = async () => {
            // 1. Auto-Login (Hardcoded for Single User Mode)
            const EMAIL = 'admin@fitgen.app';
            const PASSWORD = 'D*UWQufY_h.w8_2'; // User provided DB password, using as Auth password

            let { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log('No session, attempting auto-login...');
                // Try signing in
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: EMAIL,
                    password: PASSWORD
                });

                if (signInError) {
                    console.warn('Auto-login failed, attempting to create user...', signInError.message);
                    // Try signing up if login fails (first run)
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: EMAIL,
                        password: PASSWORD
                    });

                    if (signUpData.session) {
                        session = signUpData.session;
                    } else if (signUpError) {
                        console.error('Auto-signup failed:', signUpError.message);
                    } else {
                        console.log('User created. Please confirm email if enabled in Supabase.');
                    }
                } else {
                    session = signInData.session;
                }
            }

            setUser(session?.user ?? null);

            // 2. Load Local Storage (Fast Fallback)
            const localData = loadFromStorage();
            if (localData) {
                const today = new Date().toDateString();
                const isCompleted = localData.history?.some((h: WorkoutHistory) => new Date(h.date).toDateString() === today);

                setState(prev => ({
                    ...prev,
                    ...localData,
                    completedToday: isCompleted || false,
                    currentSplit: localData.currentSplit || 'Push'
                }));
            }

            // 3. Load from Supabase (Source of Truth)
            if (session?.user) {
                try {
                    // Load Settings
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('equipment')
                        .eq('id', session.user.id)
                        .single();

                    if (settings) {
                        setState(prev => ({ ...prev, equipment: settings.equipment }));
                    }

                    // Load History (Last workout)
                    // This is simplified; normally we'd fetch the whole history or just the latest for logic
                    // For now, let's keep history local-first but push to DB
                } catch (e) {
                    console.error('Supabase load error:', e);
                }
            }

            // 4. Load API Data
            try {
                const { fetchExercisesFromAPI, mapApiToInternal } = await import('../services/exerciseDB');
                const apiData = await fetchExercisesFromAPI();
                if (apiData.length > 0) {
                    setApiExercises(mapApiToInternal(apiData));
                }
            } catch (e) {
                console.error("Failed to load API exercises", e);
            }

            setIsLoaded(true);
        };

        init();

        // Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Save to storage & Supabase on change
    useEffect(() => {
        if (isLoaded) {
            saveToStorage(state);

            // Sync to Supabase if logged in
            if (user) {
                const sync = async () => {
                    // Upsert Settings
                    await supabase.from('user_settings').upsert({
                        id: user.id,
                        equipment: state.equipment,
                        updated_at: new Date().toISOString()
                    });
                };
                sync();
            }
        }
    }, [state, isLoaded, user]);

    // Generate workout if needed
    useEffect(() => {
        if (!isLoaded) return; // Wait for API and Storage to load

        const today = new Date().toDateString();
        // Check if we already have a workout for today
        // If we loaded from storage, lastWorkoutDate will be set.
        // If it's not today, or if we haven't completed it, we might need to generate.

        // But if we just loaded a workout from storage that IS for today, we shouldn't overwrite it.
        // The issue is: if storage was empty (new user or reset), lastWorkoutDate is null.
        // So we generate.

        if (state.lastWorkoutDate !== today && !state.completedToday) {
            generateWorkout();
        }
    }, [isLoaded, state.lastWorkoutDate, state.equipment, state.completedToday]);

    const getAvailableExercises = (eqString: string, category?: string) => {
        const userEq = eqString.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        if (!userEq.includes('bodyweight')) userEq.push('bodyweight');

        // Merge Local + API
        const allExercises = [...EXERCISES, ...apiExercises];

        // Deduplicate by name (prefer API version for GIF)
        const uniqueExercises = Array.from(new Map(allExercises.map(item => [item.name, item])).values());

        return uniqueExercises.filter(ex => {
            // Filter by Category (Split)
            if (category && ex.category !== category && category !== 'Full Body') {
                return false;
            }
            const req = ex.equipment.toLowerCase();
            const requirements = req.split(',').map(r => r.trim());
            return requirements.every(r => userEq.some(u => u.includes(r) || r.includes(u)));
        });
    };

    const generateWorkout = () => {
        // If we just completed a workout yesterday, rotate split. 
        // But here we just want to generate for the *current* split state.
        // The rotation happens on completion.

        const available = getAvailableExercises(state.equipment, state.currentSplit);
        const count = 8;

        // Fallback if not enough exercises for split (e.g. only have bands)
        // If < 4 exercises, try Full Body or just all available
        let pool = available;
        if (pool.length < 4) {
            pool = getAvailableExercises(state.equipment); // Fallback to all
        }

        const shuffled = [...pool].sort(() => 0.5 - Math.random());

        setState(prev => ({
            ...prev,
            dailyWorkout: shuffled.slice(0, count),
            lastWorkoutDate: new Date().toDateString()
        }));
    };

    const updateEquipment = (eq: string) => {
        setState(prev => ({ ...prev, equipment: eq }));
        // Optionally regenerate workout immediately
        // generateWorkout(); 
    };

    const completeWorkout = () => {
        const today = new Date().toISOString();
        const newHistory = [...state.history, { date: today, exercises: state.dailyWorkout }];

        // Rotate Split
        const splits: ('Push' | 'Pull' | 'Legs')[] = ['Push', 'Pull', 'Legs'];
        const currentIdx = splits.indexOf(state.currentSplit as any);
        const nextSplit = currentIdx !== -1 ? splits[(currentIdx + 1) % splits.length] : 'Push';

        setState(prev => ({
            ...prev,
            history: newHistory,
            completedToday: true,
            currentSplit: nextSplit
        }));
    };

    const refreshWorkout = () => {
        generateWorkout();
    };

    return (
        <WorkoutContext.Provider value={{ ...state, updateEquipment, completeWorkout, refreshWorkout }}>
            {!isLoaded ? (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading exercises...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => {
    const context = useContext(WorkoutContext);
    if (context === undefined) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
};
