import type { Exercise } from '../data/exercises';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend Exercise to include completion status
export interface WorkoutExercise extends Exercise {
    completed?: boolean;
    reps?: string;
}



interface WorkoutHistory {
    date: string;
    split: string;
    focusArea?: string;
    exercises: WorkoutExercise[];
}

interface WorkoutState {
    equipment: string;
    dailyWorkout: WorkoutExercise[];
    lastWorkoutDate: string | null;
    history: WorkoutHistory[];
    completedToday: boolean;
    currentSplit: 'Push' | 'Pull' | 'Legs' | 'Full Body';
    focusArea: string; // 'Default', 'Chest', 'Back', etc.
    excludedExercises: string[];
    connectionStatus: 'connected' | 'disconnected' | 'checking';
    connectionError?: string;
    lastSyncTime?: string | null;
    customWorkoutActive: boolean;
    customTargets: string[];
    customEquipment: string[];
    favorites: string[];
    customExercises: Exercise[];
    userEquipmentProfile: string;
    availableExerciseNames: string[]; // Whitelist of valid exercises based on profile
    openaiApiKey: string;
    includeLegs: boolean; // NEW: Option to include/exclude leg exercises
    isGenerating: boolean; // NEW: Global loading state for fun transitions
    generationStatus?: string; // NEW: Status message for loader (e.g. "Consulting AI...")
    programMode: 'standard' | 'upper_body_cycle';
    cycleIndex: number; // 0-3 for ABCD cycle
}

interface WorkoutContextType extends WorkoutState {
    updateEquipment: (eq: string) => void;
    refreshWorkout: () => void;
    allExercises: Exercise[];
    getAvailableExercises: (eq: string, category?: string) => Exercise[];
    excludeExercise: (exerciseName: string) => void;
    restoreExercise: (exerciseName: string) => void;
    replaceExercise: (exerciseName: string) => void;
    toggleExerciseCompletion: (exerciseName: string) => void;
    reorderWorkout: (newOrder: WorkoutExercise[]) => void;
    setFocusArea: (area: string) => void;
    generateCustomWorkout: (targets: string[], equipment: string[]) => void;
    clearCustomWorkout: () => void;
    toggleFavorite: (exerciseName: string) => void;
    addCustomExercise: (prompt: string) => Promise<Exercise>;
    deleteCustomExercise: (exerciseName: string) => void;
    updateUserEquipmentProfile: (profile: string) => Promise<void>;
    setOpenaiApiKey: (key: string) => void;
    testPersistence: () => Promise<string>;
    toggleLegs: (enabled: boolean) => void;
    setSplit: (split: string) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setGenerationStatus: (status: string | undefined) => void;
    setProgramMode: (mode: 'standard' | 'upper_body_cycle') => void;
}

import { supabase } from '../services/supabase';
import { BASE_MOVEMENTS } from '../data/exercises';
import { SmartParser } from '../utils/smartParser';

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const initialState: WorkoutState = {
    equipment: '',
    dailyWorkout: [],
    lastWorkoutDate: null,
    history: [],
    completedToday: false,
    currentSplit: 'Push', // Default type correct
    focusArea: 'Default',
    excludedExercises: [],
    connectionStatus: 'checking',
    connectionError: undefined,
    lastSyncTime: undefined,
    customWorkoutActive: false,
    customTargets: [],
    customEquipment: [],
    favorites: [],
    customExercises: [],
    userEquipmentProfile: '',
    availableExerciseNames: [],
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '', // Load from env if available
    includeLegs: true, // Default ON, removed localStorage
    isGenerating: false,
    programMode: 'upper_body_cycle', // Forced Default
    cycleIndex: 0
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<WorkoutState>(initialState);

    const [isLoaded, setIsLoaded] = useState(false);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Load Exercises from DB on Mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                // 1. Fetch from Supabase
                const { data, error } = await supabase.from('exercises').select('*');
                if (error) throw error;

                if (data && data.length > 0) {
                    const dbExercises: Exercise[] = data.map(d => ({
                        name: d.name,
                        category: d.category,
                        muscles: d.muscle_group,
                        muscleGroup: d.muscle_group, // Map DB 'muscle_group' -> App 'muscleGroup'
                        equipment: d.equipment,
                        type: 'Compound',
                        gifUrl: d.gif_url,
                        id: d.id || `db-${Math.random()}`
                    }));
                    setAllExercises(dbExercises);
                    setState(prev => ({ ...prev, connectionStatus: 'connected' }));
                } else {
                    // Fallback
                    const staticExercises: Exercise[] = BASE_MOVEMENTS.map((ex: any, i) => ({
                        id: `static-${i}`,
                        name: ex.name,
                        category: ex.category,
                        muscleGroup: ex.muscles,
                        equipment: ex.equipment,
                        type: 'Compound',
                        muscles: ex.muscles,
                        gifUrl: ex.gif_url
                    }));
                    setAllExercises(staticExercises);
                }
            } catch (err) {
                console.warn('Offline or DB Error, using static data:', err);
                const staticExercises: Exercise[] = BASE_MOVEMENTS.map((ex: any, i) => ({
                    id: `static-${i}`,
                    name: ex.name,
                    category: ex.category,
                    muscleGroup: ex.muscles,
                    equipment: ex.equipment,
                    type: 'Compound',
                    muscles: ex.muscles
                }));
                setAllExercises(staticExercises);
                setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
            } finally {
                setIsLoaded(true);
            }
        };
        initializeData();
    }, []);

    // Loading Animation (UI only)
    useEffect(() => {
        if (isLoaded) {
            setLoadingProgress(100);
            return;
        }
        const interval = setInterval(() => {
            setLoadingProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        return () => clearInterval(interval);
    }, [isLoaded]);

    // --- SUPABASE AUTH & SYNC ---
    useEffect(() => {
        const connectToCloud = async () => {
            try {
                // 1. Auto-Login
                let authData = null;
                let authError = null;

                ({ data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: 'roy.rubin@gmail.com',
                    password: 'password123',
                }));

                if (authError || !authData?.session) {
                    console.log('Login failed, trying signup/session check...');
                    // Just check session if login failed (maybe already logged in?)
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData.session) {
                        authData = sessionData;
                    } else {
                        // Attempt Signup
                        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                            email: 'roy.rubin@gmail.com',
                            password: 'password123',
                        });
                        if (signUpData.session) authData = signUpData;
                        else if (signUpError) throw signUpError;
                    }
                }

                const userId = authData?.session?.user?.id;

                if (userId) {
                    console.log('☁️ Connected to Cloud as:', authData?.session?.user.email);

                    // 2. Load Cloud Data (Settings & State)
                    const { data: settingsData } = await supabase
                        .from('user_settings')
                        .select('equipment, excluded_exercises, current_split, daily_workout, last_workout_date, completed_today, focus_area, favorites, user_equipment_profile, custom_exercises, openai_api_key, available_exercise_names, include_legs, program_mode, cycle_index')
                        .eq('id', userId)
                        .single();

                    console.log('☁️ Loaded Settings:', settingsData);

                    // 3. Load Cloud Data (History)
                    const { data: historyData } = await supabase
                        .from('workout_history')
                        .select('*')
                        .eq('user_id', userId);

                    // 4. Merge/Update State
                    setState(prev => {
                        const newEquipment = settingsData?.equipment || prev.equipment;
                        const newExcluded = settingsData?.excluded_exercises || prev.excludedExercises || [];
                        const newFavorites = settingsData?.favorites || prev.favorites || [];
                        const newProfile = settingsData?.user_equipment_profile || prev.userEquipmentProfile || '';
                        const newApiKey = settingsData?.openai_api_key || prev.openaiApiKey || '';
                        const newAvailableExercises = settingsData?.available_exercise_names || prev.availableExerciseNames || [];
                        const newIncludeLegs = settingsData?.include_legs !== undefined ? settingsData.include_legs : true;

                        // Force Upper Body Cycle as default/only mode
                        const newProgramMode = 'upper_body_cycle';
                        const newCycleIndex = settingsData?.cycle_index !== undefined ? settingsData.cycle_index : 0;

                        const newSplit = settingsData?.current_split || prev.currentSplit;
                        const rawDaily = settingsData?.daily_workout ? (typeof settingsData.daily_workout === 'string' ? JSON.parse(settingsData.daily_workout) : settingsData.daily_workout) : prev.dailyWorkout;
                        // Sanitize: Deduplicate loaded workout
                        const newDailyWorkout = (rawDaily || []).filter((ex: any, index: number, self: any[]) =>
                            index === self.findIndex((t: any) => t.name === ex.name)
                        );
                        const newLastDate = settingsData?.last_workout_date || prev.lastWorkoutDate;
                        const newCompletedToday = settingsData?.completed_today !== undefined ? settingsData.completed_today : prev.completedToday;
                        const newFocusArea = 'Default';

                        const cloudHistory = historyData?.map((h: any) => ({
                            date: h.date,
                            split: h.split,
                            exercises: typeof h.exercises === 'string' ? JSON.parse(h.exercises) : h.exercises
                        })) || [];

                        return {
                            ...prev,
                            equipment: newEquipment,
                            excludedExercises: newExcluded,
                            favorites: newFavorites,
                            userEquipmentProfile: newProfile,
                            openaiApiKey: newApiKey,
                            availableExerciseNames: newAvailableExercises,
                            includeLegs: newIncludeLegs,
                            programMode: newProgramMode,
                            cycleIndex: newCycleIndex,
                            currentSplit: newSplit,
                            dailyWorkout: newDailyWorkout,
                            lastWorkoutDate: newLastDate,
                            completedToday: newCompletedToday,
                            focusArea: newFocusArea,
                            history: cloudHistory.length > 0 ? cloudHistory : prev.history,
                            connectionStatus: 'connected',
                            lastSyncTime: new Date().toLocaleTimeString()
                        };
                    });
                }
            } catch (e: any) {
                console.error('Cloud Connection Error:', e);
                setState(prev => ({
                    ...prev,
                    connectionStatus: 'disconnected',
                    connectionError: e.message || 'Unknown connection error'
                }));
            }
        };
        connectToCloud();
    }, []);

    // Sync State changes to Cloud
    useEffect(() => {
        if (!isLoaded || state.connectionStatus === 'checking') return;

        const syncToCloud = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Upsert Settings
            const { error: syncError } = await supabase
                .from('user_settings')
                .upsert({
                    id: user.id,
                    equipment: state.equipment,
                    excluded_exercises: state.excludedExercises,
                    favorites: state.favorites,
                    user_equipment_profile: state.userEquipmentProfile,
                    custom_exercises: state.customExercises, // NEW: Sync Custom Exercises
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

            if (syncError) {
                console.error('❌ Sync Failed:', syncError.message, syncError.details);
            } else {
                console.log('✅ Sync Success');
                setState(prev => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString() }));
            }
        };

        // Debounce (Fast sync to catch "Complete" actions before close)
        const timeout = setTimeout(syncToCloud, 500);
        return () => clearTimeout(timeout);
    }, [
        state.equipment,
        state.excludedExercises,
        state.favorites,
        state.userEquipmentProfile,
        state.customExercises,
        state.currentSplit,
        state.dailyWorkout,
        state.lastWorkoutDate,
        state.completedToday,
        state.focusArea,
        state.focusArea,
        state.openaiApiKey, // Ensure API Key changes trigger sync
        state.availableExerciseNames, // Sync Whitelist
        isLoaded,
        state.connectionStatus
    ]);


    // Generate workout if needed
    useEffect(() => {
        if (!isLoaded) return; // Wait for API and Storage to load

        const today = new Date().toDateString();


        if (state.lastWorkoutDate !== today) {
            // It's a new day!
            let nextSplit = state.currentSplit;

            // If we completed the last workout, rotate!
            // If we completed the last workout, rotate!
            if (state.completedToday) {
                let splits: ('Push' | 'Pull' | 'Legs')[] = ['Push', 'Pull', 'Legs'];
                if (!state.includeLegs) {
                    splits = ['Push', 'Pull'];
                }
                const currentIdx = splits.indexOf(state.currentSplit as any);
                // If current split is not in the valid list (e.g. was Legs but now disabled), default to first (Push)
                if (currentIdx === -1) {
                    nextSplit = splits[0];
                } else {
                    nextSplit = splits[(currentIdx + 1) % splits.length];
                }
            }

            // Update state first
            setState(prev => ({
                ...prev,
                currentSplit: nextSplit,
                completedToday: false,
                lastWorkoutDate: today // Mark today as visited so we don't loop
            }));

            // Then generate (we need to pass the new split because state update is async)
            // But generateWorkout reads from state... 
            // We can modify generateWorkout to accept a split.
            setTimeout(() => generateWorkout(nextSplit), 0);
        } else if (!state.dailyWorkout.length) {
            // If it's still the same day but no workout has been generated yet (e.g., initial load)
            generateWorkout(state.currentSplit, state.focusArea);
        }
    }, [isLoaded, state.lastWorkoutDate, state.completedToday, state.currentSplit, state.dailyWorkout.length, state.focusArea]);

    // --- SMART MATCHING LOGIC ---
    const normalizeUserEquipment = (userInput: string): string[] => {
        const rawItems = userInput.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        const mappedItems = new Set<string>();

        // Always include bodyweight IF enabled
        // Always include bodyweight
        mappedItems.add('body weight');
        mappedItems.add('body only');
        mappedItems.add('bodyweight');

        rawItems.forEach(item => {
            // Direct match (cleaned)
            mappedItems.add(item);
            mappedItems.add(item.replace(/\s+/g, '')); // Add "kettlebells" from "kettle bells"

            // Synonyms & Inferences
            if (item.includes('dumb')) {
                mappedItems.add('dumbbell');
                mappedItems.add('dumbbells');
            }
            if (item.includes('bar') && !item.includes('cable') && !item.includes('pull')) {
                mappedItems.add('barbell');
                mappedItems.add('ez curl bar');
                mappedItems.add('ez bar');
            }
            if (item.includes('kettle')) {
                mappedItems.add('kettlebell');
                mappedItems.add('kettlebells');
            }
            if (item.includes('cable') || item.includes('pulley') || item.includes('rope')) {
                mappedItems.add('cable');
                mappedItems.add('cables');
            }
            if ((item.includes('machine') || item.includes('gym') || item.includes('pec')) && !item.includes('cable')) {
                mappedItems.add('machine');
                mappedItems.add('smith machine');
            }
            if (item.includes('band') || item.includes('resistance')) {
                mappedItems.add('bands');
                mappedItems.add('band');
            }
            if (item.includes('ball') || item.includes('medicine')) {
                mappedItems.add('medicine ball');
                mappedItems.add('exercise ball');
            }
            if (item.includes('bench')) {
                mappedItems.add('bench');
            }
            if (item.includes('box') || item.includes('step')) {
                mappedItems.add('box');
            }
            if (item.includes('plate')) {
                mappedItems.add('plate');
            }
            if (item.includes('pull') && (item.includes('up') || item.includes('bar'))) {
                mappedItems.add('pull-up bar');
            }
        });

        return Array.from(mappedItems);
    };

    const getAvailableExercises = (eqString: string, category?: string) => {
        // AI PROFILE MODE (Primary)
        if (state.userEquipmentProfile && state.availableExerciseNames.length > 0) {
            let uniqueExercises = allExercises.filter(ex =>
                state.availableExerciseNames.includes(ex.name) &&
                !state.excludedExercises.includes(ex.name) // Filter excluded items from AI pool
            );

            if (category && category !== 'Full Body') {
                uniqueExercises = uniqueExercises.filter(ex => {
                    const mg = ex.muscleGroup.toLowerCase();
                    if (category === 'Arms') {
                        return ['Biceps', 'Triceps', 'Forearms', 'Arms'].map(s => s.toLowerCase()).includes(mg);
                    }
                    if (category === 'Back') {
                        return ['lats', 'middle back', 'lower back', 'traps', 'back'].includes(mg);
                    }
                    if (category === 'Legs') {
                        return ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors', 'legs', 'quads'].includes(mg);
                    }
                    return ex.category === category || ex.muscleGroup === category;
                });
            }

            // Console log to debug
            // console.log(`getAvailableExercises (AI Profile) -> Count: ${uniqueExercises.length}`);
            return uniqueExercises;
        }

        // LEGACY MODE (Fallback if no profile)
        const legacyUserEq = normalizeUserEquipment(eqString);

        let uniqueExercises = allExercises;

        // Filter by category first
        if (category && category !== 'Full Body') { // 'Full Body' category means no specific category filter
            uniqueExercises = uniqueExercises.filter(ex => ex.category === category);
        }

        const filtered = uniqueExercises.filter(ex => {
            // GLOBAL FILTER: Excluded Exercises
            if (state.excludedExercises.includes(ex.name)) return false;

            // GLOBAL FILTER: Exclude Legs if disabled
            if (!state.includeLegs) {
                const isLegs = ex.category === 'Legs' ||
                    ['quads', 'hamstrings', 'calves', 'glutes', 'legs', 'adductors', 'abductors'].includes(ex.muscleGroup.toLowerCase());
                if (isLegs) return false;
            }

            // Filter by Category (Split)
            if (category && category !== 'Full Body') {
                if (category === 'Arms') {
                    // Special Case: Arms includes Biceps, Triceps, Forearms
                    const isArm = ['Biceps', 'Triceps', 'Forearms', 'Arms'].includes(ex.muscleGroup);
                    if (!isArm) return false;
                } else if (category === 'Back') {
                    // FIX: Back includes Lats, Middle Back, Lower Back, Traps
                    // Case insensitive check just in case
                    const mg = ex.muscleGroup.toLowerCase();
                    const isBack = ['lats', 'middle back', 'lower back', 'traps', 'back'].includes(mg);
                    if (!isBack && ex.category !== 'Pull') return false; // Also allow Pull category if muscle is ambiguous?
                    if (!isBack) return false;
                } else if (category === 'Legs') {
                    const mg = ex.muscleGroup.toLowerCase();
                    const isLegs = ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors', 'legs', 'quads'].includes(mg);
                    if (!isLegs) return false;
                } else {
                    // Check if filter matches Category (Split) OR Muscle Group (Focus)
                    // e.g. category='Shoulders' matches ex.muscleGroup='Shoulders' (even if ex.category='Push')
                    if (ex.category !== category && ex.muscleGroup !== category) {
                        return false;
                    }
                }
            }

            // Smart Equipment Check
            // Smart Equipment Check (Handle string or string[])
            const requiredList: string[] = Array.isArray(ex.equipment)
                ? ex.equipment.map(e => e.toLowerCase().trim())
                : (ex.equipment ? [ex.equipment.toLowerCase().trim()] : []);

            if (requiredList.length === 0) return false;

            // Check if ANY of the user's mapped equipment matches ANY required option (OR logic for variations)
            return legacyUserEq.some(u =>
                requiredList.some(req => {
                    if (req.length < 3) return u === req;
                    return req.includes(u) || u.includes(req);
                })
            );
        });

        // console.log(`getAvailableExercises('${eqString}') -> userEq:`, legacyUserEq, 'Count:', uniqueExercises.length, '->', filtered.length);
        return filtered;
    };

    // Pure helper to calculate workout data without setting state
    const calculateWorkout = (split?: string, focus?: string) => {
        let splitToUse = split || state.currentSplit;
        let focusToUse = focus || state.focusArea;

        // --- NEW PROGRAM LOGIC ---
        if (state.programMode === 'upper_body_cycle' && !focus && !split) {
            // Cycle Logic (A, B, C, D)
            const cyclePhase = state.cycleIndex % 4; // 0-3
            const phaseName = ['Push (Strength)', 'Pull (Hypertrophy)', 'Push (Volume)', 'Pull (Variation)'][cyclePhase];

            const selectedExercises: WorkoutExercise[] = [];
            const equipmentToUse = state.equipment;
            const available = getAvailableExercises(equipmentToUse, 'Full Body'); // Get everything to filter manually

            // Get Recent Exercises (Last 3 Workouts) to enforce variety
            const recentHistory = state.history.slice(-3);
            const recentNames = new Set(recentHistory.flatMap(h => h.exercises.map(e => e.name)));

            const pick = (criteria: (ex: Exercise) => boolean, count: number, reps: string) => {
                let candidates = available.filter(criteria).filter(ex => !selectedExercises.find(s => s.name === ex.name));

                // Sort by Priority:
                // 1. (Not Recent) + (Favorite)
                // 2. (Not Recent) + (Not Favorite)
                // 3. (Recent) + (Favorite)  <- For when we run out of fresh moves
                // 4. (Recent) + (Not Favorite)

                candidates.sort((a, b) => {
                    const isFavA = state.favorites.includes(a.name);
                    const isFavB = state.favorites.includes(b.name);
                    const isRecentA = recentNames.has(a.name);
                    const isRecentB = recentNames.has(b.name);

                    // Assign scores (Higher is better)
                    const scoreA = (isRecentA ? 0 : 2) + (isFavA ? 1 : 0);
                    const scoreB = (isRecentB ? 0 : 2) + (isFavB ? 1 : 0);

                    if (scoreA > scoreB) return -1;
                    if (scoreA < scoreB) return 1;

                    return 0.5 - Math.random();
                });

                candidates.slice(0, count).forEach(ex => {
                    selectedExercises.push({ ...ex, reps });
                });
            };

            const has = (name: string, part: string | string[]) => {
                const parts = Array.isArray(part) ? part : [part];
                return parts.some(p => name.toLowerCase().includes(p.toLowerCase()));
            };

            if (cyclePhase === 0) { // A: Push Strength
                // 1. Flat Horizontal Press (5-8)
                pick(ex => ex.category === 'Push' && has(ex.name, ['Bench', 'Floor']) && !has(ex.name, 'Incline') && ex.type === 'Compound', 1, '5-8');
                // 2. Vertical Press (5-8)
                pick(ex => ex.category === 'Push' && has(ex.name, ['Overhead', 'Arnold', 'Military']) && ex.type === 'Compound', 1, '5-8');
                // 3. Tricep Extension (Heavy)
                pick(ex => ex.category === 'Push' && ex.muscleGroup === 'Triceps' && has(ex.name, ['Skull', 'Extension', 'Close Grip']), 1, '8-10');
                // Fill remaining
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Push', 5 - selectedExercises.length, '8-12');
            }
            else if (cyclePhase === 1) { // B: Pull Hypertrophy
                // 1. Vertical Pull (High Volume)
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Pull-up', 'Chin-up', 'Lat Pulldown']) && !has(ex.name, 'Neutral'), 1, '10-15');
                // 2. Horizontal Row (Controlled)
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Seated Row', 'Cable', 'Machine']), 1, '10-15');
                // 3. Bicep Curl
                pick(ex => ex.category === 'Pull' && ex.muscleGroup === 'Biceps', 1, '10-15');
                // 4. Rear Delt
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Face Pull', 'Rear Delt']), 1, '12-15');
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Pull', 5 - selectedExercises.length, '10-12');
            }
            else if (cyclePhase === 2) { // C: Push Volume
                // 1. Incline Press
                pick(ex => ex.category === 'Push' && has(ex.name, 'Incline'), 1, '10-15');
                // 2. Vertical Press (Accessory)
                pick(ex => ex.category === 'Push' && has(ex.name, ['Dumbbell Press', 'Machine Press']), 1, '10-15');
                // 3. Lateral Raise - Note: Lateral Raises are 'Push' in our data
                pick(ex => ex.category === 'Push' && has(ex.name, 'Lateral'), 1, '12-15');
                // 4. Tricep Pushdown
                pick(ex => ex.category === 'Push' && has(ex.name, 'Pushdown'), 1, '12-15');
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Push', 5 - selectedExercises.length, '10-15');
            }
            else if (cyclePhase === 3) { // D: Pull Variation
                // 1. Heavy Row
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Barbell Row', 'T-Bar', 'Pendlay', 'Deadlift']), 1, '8-12');
                // 2. Neutral Vertical Pull
                pick(ex => ex.category === 'Pull' && (has(ex.name, 'Neutral') || has(ex.name, 'Hammer')), 1, '8-12');
                // 3. Hammer Curl
                pick(ex => ex.category === 'Pull' && has(ex.name, 'Hammer Curl'), 1, '10-12');
                // 4. Upper Back/Shrug
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Shrug', 'Face Pull']), 1, '10-12');
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Pull', 5 - selectedExercises.length, '8-12');
            }

            return { selectedExercises, splitToUse: `Cycle: ${phaseName}` };
        }

        // --- STANDARD SPLIT ROTATION ---
        if (!split && !focus) {
            const splits = ['Push', 'Pull'];
            if (state.includeLegs) splits.push('Legs');
            const currentIndex = splits.indexOf(state.currentSplit);
            splitToUse = splits[(currentIndex + 1) % splits.length] as any;
        }

        const getSlots = (split: string) => {
            if (focusToUse && focusToUse !== 'Default' && focusToUse !== 'Bodyweight') {
                if (focusToUse === 'Arms') {
                    return [
                        { type: 'Isolation', muscle: 'Biceps', count: 3 },
                        { type: 'Isolation', muscle: 'Triceps', count: 3 },
                        { type: 'Compound', muscle: 'Shoulders', count: 1 },
                        { type: 'Isolation', muscle: 'Forearms', count: 1 }
                    ];
                }
                return [
                    { type: 'Compound', muscle: focusToUse, count: 3 },
                    { type: 'Isolation', muscle: focusToUse, count: 3 },
                    { type: 'Compound', muscle: focusToUse, count: 2 }
                ];
            }

            if (split === 'Push') return [
                { type: 'Compound', muscle: 'Chest', count: 2 },
                { type: 'Compound', muscle: 'Shoulders', count: 2 },
                { type: 'Isolation', muscle: 'Chest', count: 1 },
                { type: 'Isolation', muscle: 'Shoulders', count: 1 },
                { type: 'Isolation', muscle: 'Triceps', count: 2 },
            ];
            if (split === 'Pull') return [
                { type: 'Compound', muscle: 'Back', count: 3 },
                { type: 'Isolation', muscle: 'Rear Delts', count: 1 },
                { type: 'Isolation', muscle: 'Biceps', count: 3 },
                { type: 'Isolation', muscle: 'Traps', count: 1 },
            ];
            if (split === 'Legs') return [
                { type: 'Compound', muscle: 'Quads', count: 2 },
                { type: 'Compound', muscle: 'Hamstrings', count: 2 },
                { type: 'Compound', muscle: 'Legs', count: 1 },
                { type: 'Isolation', muscle: 'Quads', count: 1 },
                { type: 'Isolation', muscle: 'Hamstrings', count: 1 },
                { type: 'Isolation', muscle: 'Calves', count: 1 },
            ];
            return [
                { type: 'Compound', muscle: 'Legs', count: 2 },
                { type: 'Compound', muscle: 'Chest', count: 2 },
                { type: 'Compound', muscle: 'Back', count: 2 },
                { type: 'Compound', muscle: 'Shoulders', count: 1 },
                { type: 'Isolation', muscle: 'Arms', count: 1 },
            ];
        };

        const slots = getSlots(splitToUse);
        const equipmentToUse = focusToUse === 'Bodyweight' ? 'Bodyweight' : state.equipment;

        let categoryFilter = splitToUse;
        if (focusToUse && focusToUse !== 'Default' && focusToUse !== 'Bodyweight') {
            categoryFilter = focusToUse;
        }

        const availableForSplit = getAvailableExercises(equipmentToUse, categoryFilter);
        const selectedExercises: Exercise[] = [];
        const usedNames = new Set<string>();

        slots.forEach((slot: any) => {
            const candidates = availableForSplit.filter(ex => {
                if (state.excludedExercises.includes(ex.name)) return false;
                const target = slot.muscle.toLowerCase();
                const exMuscle = ex.muscleGroup.toLowerCase();
                const muscleMatch = exMuscle.includes(target) ||
                    (target === 'arms' && (exMuscle.includes('biceps') || exMuscle.includes('triceps'))) ||
                    (target === 'back' && (exMuscle.includes('lats') || exMuscle.includes('traps')));
                return muscleMatch && !usedNames.has(ex.name);
            });

            const shuffled = candidates.sort((a, b) => {
                const isFavA = state.favorites.includes(a.name);
                const isFavB = state.favorites.includes(b.name);
                if (isFavA && !isFavB) return Math.random() < 0.7 ? -1 : 1;
                if (!isFavA && isFavB) return Math.random() < 0.7 ? 1 : -1;
                return 0.5 - Math.random();
            });
            const picked = shuffled.slice(0, slot.count);
            picked.forEach(p => {
                selectedExercises.push(p);
                usedNames.add(p.name);
            });
        });

        if (selectedExercises.length < 8) {
            const fallbackPool = getAvailableExercises(equipmentToUse, categoryFilter);
            const remaining = fallbackPool
                .filter(ex => !usedNames.has(ex.name) && !state.excludedExercises.includes(ex.name))
                .sort(() => 0.5 - Math.random())
                .slice(0, 8 - selectedExercises.length);
            selectedExercises.push(...remaining);
        }

        return { selectedExercises, splitToUse };
    };

    const generateWorkout = async (splitOverride?: string, focusOverride?: string) => {
        const splitToUse = splitOverride || state.currentSplit;
        const focusToUse = focusOverride || state.focusArea;
        const apiKey = state.openaiApiKey;

        console.log(`💪 generatingWorkout... Split: ${splitToUse}, Focus: ${focusToUse}, Override: ${focusOverride}`);

        // 0. Update Status Initial
        setState(prev => ({ ...prev, generationStatus: "Analyzing Equipment... 🔍" }));

        // --- AI GENERATION MODE ---
        if (apiKey && state.userEquipmentProfile) {
            console.log('🤖 Generating AI Workout...');
            setState(prev => ({ ...prev, generationStatus: "Consulting AI Coach... 🤖" }));

            try {
                // CRITICAL FIX: Do NOT pre-filter whitelist by Split if using AI.
                // Allow AI to select from ALL equipment-valid exercises to handle Focus overrides properly.
                const equipmentValidExercises = getAvailableExercises(state.equipment, 'Full Body');

                // If focus is active, we can prioritize strict focus items too, but providing valid split items is the most important guardrail.
                const validNames = equipmentValidExercises.map(e => e.name);

                // Ensure custom exercises are included if they match the split
                // We should also include ALL custom exercises here and let AI decide?
                // Yes, simplify to include all custom exercises that might be relevant.
                const validCustomNames = state.customExercises.map(c => c.name);

                const finalWhitelist = [...new Set([...validNames, ...validCustomNames])];

                const aiResult = await SmartParser.generateAIWorkout(
                    state.openaiApiKey,
                    splitToUse,
                    focusToUse,
                    state.userEquipmentProfile,
                    finalWhitelist, // Pass STRICTLY filtered list
                    state.favorites // PASS FAVORITES
                );

                const aiPlan = aiResult.exercises;

                if (aiPlan.length > 0) {
                    setState(prev => ({ ...prev, generationStatus: "Finalizing Plan... ✨" }));

                    // Map AI plan to Exercise objects
                    const mappedWorkout: WorkoutExercise[] = aiPlan.map((step, idx) => {
                        // Find matching DB exercise (Standard OR Custom)
                        const allPool = [...allExercises, ...state.customExercises];

                        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

                        const stepNorm = normalize(step.name);

                        // 1. Exact Match (Normalized)
                        let existing = allPool.find(ex => normalize(ex.name) === stepNorm);

                        // 2. Contains (Bidirectional)
                        if (!existing) {
                            existing = allPool.find(ex => {
                                const exNorm = normalize(ex.name);
                                return exNorm.includes(stepNorm) || stepNorm.includes(exNorm);
                            });
                        }

                        // 3. Last Resort: Word Intersection (Best match)
                        if (!existing) {
                            // Find exercise with most matching words
                            const stepWords = step.name.toLowerCase().split(' ');
                            let bestMatch: Exercise | undefined;
                            let maxMatches = 0;

                            allPool.forEach(ex => {
                                const exWords = ex.name.toLowerCase().split(' ');
                                const matches = stepWords.filter(w => w.length > 2 && exWords.includes(w)).length;
                                if (matches > maxMatches && matches >= 2) { // At least 2 significant words match
                                    maxMatches = matches;
                                    bestMatch = ex;
                                }
                            });
                            existing = bestMatch;
                        }

                        // Construct Exercise Object
                        return {
                            id: existing?.id || `ai-${idx}-${Date.now()}`,
                            name: existing?.name || step.name, // Use DB name if found to match image!
                            category: (existing?.category || splitToUse) as any,
                            muscleGroup: existing?.muscleGroup || focusToUse,
                            equipment: existing?.equipment || 'Bodyweight',
                            gifUrl: existing?.gifUrl, // Image should work now if matched
                            type: existing?.type || 'Isolation',
                            sets: step.sets,
                            reps: step.reps,
                            notes: step.note,
                            completed: false
                        };
                    });
                    // Deduplicate by Name
                    const uniqueMappedWorkout = mappedWorkout.filter((ex, index, self) =>
                        index === self.findIndex((t) => t.name === ex.name)
                    );

                    console.log('✅ AI Workout generated:', uniqueMappedWorkout.length);
                    setState(prev => ({
                        ...prev,
                        dailyWorkout: uniqueMappedWorkout,
                        lastWorkoutDate: new Date().toDateString(),
                        currentSplit: splitToUse as any
                    }));
                    return; // EXIT EARLY
                }
            } catch (e) {
                console.error("AI Generation Failed, using fallback:", e);
                // Status update for fallback
                setState(prev => ({ ...prev, generationStatus: "AI Busy, trying fallback... ⚠️" }));
            }
        }

        // --- HEURISTIC FALLBACK (Existing Logic) ---
        console.log('⚠️ Using Heuristic Fallback Workout...');
        setState(prev => ({ ...prev, generationStatus: "Calculating Locally... 🧮" }));

        const { selectedExercises, splitToUse: newSplitToUse } = calculateWorkout(splitOverride, focusOverride);

        console.log(`✅ Final Workout Generated: ${selectedExercises.length} exercises.`);

        setState(prev => ({
            ...prev,
            dailyWorkout: selectedExercises,
            lastWorkoutDate: new Date().toDateString(),
            currentSplit: newSplitToUse as any
        }));
    };

    const updateEquipment = (eq: string) => {
        setState(prev => ({ ...prev, equipment: eq }));
        // Optionally regenerate workout immediately
        // generateWorkout(); 
    };



    const refreshWorkout = () => {
        generateWorkout();
    };

    const replaceExercise = (exerciseName: string) => {
        setState(prev => {
            const currentWorkout = [...prev.dailyWorkout];
            const index = currentWorkout.findIndex(ex => ex.name === exerciseName);

            if (index === -1) return prev;

            const oldExercise = currentWorkout[index];

            // Find a replacement
            // Use the same category logic as generateWorkout
            // But if Focus Area is set, prioritize that!
            const focusToUse = prev.focusArea;
            const equipmentToUse = focusToUse === 'Bodyweight' ? 'Bodyweight' : prev.equipment;

            const candidates = getAvailableExercises(equipmentToUse).filter(ex =>
                ex.name !== oldExercise.name && // Not the same exercise
                !prev.excludedExercises.includes(ex.name) && // Not excluded
                !currentWorkout.some(w => w.name === ex.name) // Not already in workout
            );

            // Filter by muscle group match OR Focus Area match
            const validCandidates = candidates.filter(ex => {
                // 1. Strict Muscle Match (Standard)
                if (ex.muscleGroup === oldExercise.muscleGroup) return true;

                // 2. Focus Area Match (If overriding)
                if (focusToUse && focusToUse !== 'Default' && ex.muscleGroup.includes(focusToUse)) return true;

                return false;
            });

            if (validCandidates.length > 0) {
                const replacement = validCandidates[Math.floor(Math.random() * validCandidates.length)];
                currentWorkout[index] = { ...replacement, completed: false }; // Reset completion on swap
                return {
                    ...prev,
                    dailyWorkout: currentWorkout
                };
            }

            return prev; // No replacement found
        });
    };

    // SYNC HISTORY EFFECT
    // Automatically syncs today's history to Supabase whenever it changes
    useEffect(() => {
        if (!state.completedToday && state.history.length === 0) return; // Skip initial empty

        const syncToday = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const todayStr = new Date().toDateString();
            const todayISO = new Date().toISOString().split('T')[0];

            // Find today's entry in local state
            const todayEntry = state.history.find(h => new Date(h.date).toDateString() === todayStr);

            try {
                // Check for existing DB row
                const { data: existingRows } = await supabase
                    .from('workout_history')
                    .select('id, date')
                    .eq('user_id', user.id)
                    .like('date', `${todayISO}%`);

                if (todayEntry) {
                    // We have data to save
                    if (existingRows && existingRows.length > 0) {
                        // UPDATE
                        await supabase.from('workout_history').update({
                            exercises: todayEntry.exercises,
                            split: todayEntry.split,
                            focusArea: todayEntry.focusArea || 'Default'
                        }).eq('id', existingRows[0].id);
                        console.log('✅ History Updated (Auto-Sync)');
                    } else {
                        // INSERT
                        await supabase.from('workout_history').insert({
                            user_id: user.id,
                            date: todayEntry.date, // Use the ISO string from the object
                            split: todayEntry.split,
                            focusArea: todayEntry.focusArea || 'Default',
                            exercises: todayEntry.exercises
                        });
                        console.log('✅ History Inserted (Auto-Sync)');
                    }
                } else {
                    // No local entry for today? (e.g. all unchecked). Delete if exists in DB.
                    if (existingRows && existingRows.length > 0) {
                        await supabase.from('workout_history').delete().eq('id', existingRows[0].id);
                    }
                }
            } catch (err) {
                console.error("History Sync Error:", err);
            }
        };

        const timeout = setTimeout(syncToday, 1000); // 1s Debounce
        return () => clearTimeout(timeout);
    }, [state.history]);

    // SYNC PROGRAM SETTINGS EFFECT
    useEffect(() => {
        if (!isLoaded) return;
        const syncSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_settings').upsert({
                    id: user.id,
                    program_mode: state.programMode,
                    cycle_index: state.cycleIndex
                });
            }
        };
        // Debounce slightly to avoid rapid updates if multiple state changes happen
        const t = setTimeout(syncSettings, 1000);
        return () => clearTimeout(t);
    }, [state.programMode, state.cycleIndex, isLoaded]);

    const toggleExerciseCompletion = (exerciseId: string) => {
        setState(prev => {
            // 1. Update Daily Workout - Match by ID
            const newDaily = prev.dailyWorkout.map(ex =>
                (ex.id === exerciseId || ex.name === exerciseId) ? { ...ex, completed: !ex.completed } : ex
            );
            const hasCompleted = newDaily.some(ex => ex.completed);

            // 2. Update History (Purely Local Calculation)
            const todayStr = new Date().toDateString();
            const existingHistoryIndex = prev.history.findIndex(h => new Date(h.date).toDateString() === todayStr);
            // Deduplicate the list for history
            const completedList = newDaily.filter(ex => ex.completed).filter((ex, index, self) =>
                index === self.findIndex((t) => t.name === ex.name)
            );

            let newHistory = [...prev.history];

            if (completedList.length > 0) {
                if (existingHistoryIndex >= 0) {
                    // Update
                    newHistory[existingHistoryIndex] = {
                        ...newHistory[existingHistoryIndex],
                        exercises: completedList,
                        focusArea: prev.focusArea || 'Default'
                    };
                } else {
                    // Create
                    newHistory.push({
                        date: new Date().toISOString(),
                        split: prev.currentSplit,
                        focusArea: prev.focusArea || 'Default',
                        exercises: completedList
                    });
                }
            } else {
                // Remove
                if (existingHistoryIndex >= 0) {
                    newHistory.splice(existingHistoryIndex, 1);
                }
            }

            return {
                ...prev,
                dailyWorkout: newDaily,
                completedToday: hasCompleted,
                lastWorkoutDate: hasCompleted ? new Date().toDateString() : (prev.history.length > 0 ? prev.history[prev.history.length - 1].date : null),
                history: newHistory
            };
        });
    };

    const reorderWorkout = (newOrder: WorkoutExercise[]) => {
        setState(prev => ({
            ...prev,
            dailyWorkout: newOrder
        }));
    };

    const setIsGenerating = (isGenerating: boolean) => {
        setState(prev => ({ ...prev, isGenerating }));
    };

    const setFocusArea = (area: string) => {
        // 1. Start Loader immediately
        setIsGenerating(true);

        // 2. Wait for Unicorns (Delay State Update)
        setTimeout(async () => {
            // A. Update the Focus Area (Header)
            // We do this first so the UI header changes while curtain is down
            setState(prev => {
                const completedEx = prev.dailyWorkout.filter(e => e.completed);
                const newState = { ...prev, focusArea: area };

                // Archive history if needed
                if (completedEx.length > 0) {
                    const historyEntry: WorkoutHistory = {
                        date: new Date().toISOString(),
                        split: prev.currentSplit,
                        focusArea: prev.focusArea, // Log under the OLD focus area
                        exercises: completedEx
                    };
                    newState.history = [...prev.history, historyEntry];
                    newState.completedToday = true;
                    newState.lastSyncTime = null;

                    // AUTO-ADVANCE CYCLE Logic
                    if (prev.programMode === 'upper_body_cycle') {
                        newState.cycleIndex = (prev.cycleIndex + 1) % 4;
                        // Also sync this new index to DB immediately?
                        // Ideally state sync effect handles it, but let's be safe later.
                        // Actually, the main syncToCloud effect watches state changes if we add cycleIndex to dependency?
                        // No, syncToCloud effect runs once on mount or manual.
                        // We need to ensure persistence. The `syncToCloud` effect doesn't exist as a watcher.
                        // We rely on specific actions to update DB or the one-off sync.
                        // We must update the DB here or ensure a sync effect exists.
                        // Looking at code, there IS a `syncToCloud` inside `useEffect` line 282? No, that runs once.
                        // Ah, line 938 syncs HISTORY.
                        // Line 282 is "Sync State changes to Cloud" but it has `[]` dependency?
                        // Wait, looking at line 282 in previous `view_file` (Step 586):
                        // `useEffect(() => { ... }, []);` -> It only runs ONCE.
                        // This means `user_settings` are NOT automatically synced on state change currently?
                        // Let's re-read line 282 from Step 586. 
                        // Yes, it has `[]` dependency.
                        // BUT, `updateUserEquipmentProfile` and `toggleLegs` manually call upsert.
                        // So I should manually call upsert here or add a useEffect watcher for cycleIndex.
                        // I'll stick to updating state here, and I'll add a `useEffect` watcher for `programMode` and `cycleIndex` to auto-persist them.
                    }
                }
                return newState;
            });

            // B. Generate Workout (Async - handles AI or Heuristic)
            // We await this so we know data is ready
            await generateWorkout(state.currentSplit, area);

            // C. Lift the Curtain
            // We hold the loader for a significant beat (1s) AFTER data generation
            setTimeout(() => {
                setIsGenerating(false);
            }, 1000);
        }, 2200);
    };

    const setSplit = (split: string) => {
        setIsGenerating(true);
        setTimeout(async () => {
            setState(prev => ({ ...prev, currentSplit: split as any, completedToday: false }));
            await generateWorkout(split, state.focusArea);
            setIsGenerating(false);
        }, 500);
    };

    const generateCustomWorkout = async (targets: string[], equipment: string[]) => {
        console.log('Generating Custom Workout for:', targets, equipment);
        setIsGenerating(true);

        // Artificial Delay for Fun Loader
        await new Promise(r => setTimeout(r, 2500));

        let availablePool = allExercises; // Start with everything

        // 1. Filter by Equipment (if provided)
        if (equipment.length > 0) {
            // Normalize user selection first? Assuming simple strings for now
            // Or reuse getAvailableExercises logic?
            // getAvailableExercises logic is complex, let's reuse a simpified version
            // or just use getAvailableExercises('Full Body') but passing the custom equipment string?
            // Construct a fake "User Equipment String"
            const eqString = equipment.join(', ');

            // Normalize here to be safe
            const userEq = normalizeUserEquipment(eqString);

            availablePool = availablePool.filter(ex => {
                const requiredList: string[] = Array.isArray(ex.equipment)
                    ? ex.equipment.map(e => e.toLowerCase().trim())
                    : (ex.equipment ? [ex.equipment.toLowerCase().trim()] : []);

                if (requiredList.length === 0) return false;

                return userEq.some(u =>
                    requiredList.some(req => {
                        if (req.length < 3) return u === req;
                        return req.includes(u) || u.includes(req);
                    })
                );
            });
        }

        const selected: WorkoutExercise[] = [];
        const usedNames = new Set<string>();

        // 2. Select Exercises for EACH Target
        targets.forEach(target => {
            // Find candidates matching this muscle group
            const candidates = availablePool.filter(ex => {
                if (state.excludedExercises.includes(ex.name)) return false;

                const exMuscle = ex.muscleGroup.toLowerCase();
                const t = target.toLowerCase();

                const match = exMuscle.includes(t) ||
                    (t === 'arms' && (exMuscle.includes('biceps') || exMuscle.includes('triceps'))) ||
                    (t === 'push' && ['chest', 'shoulders', 'triceps'].some(m => exMuscle.includes(m))) ||
                    (t === 'pull' && ['back', 'biceps', 'traps'].some(m => exMuscle.includes(m))) ||
                    (t === 'legs' && ['quads', 'hamstrings', 'calves', 'glutes'].some(m => exMuscle.includes(m)));

                return match && !usedNames.has(ex.name);
            });

            // Pick 2-3 per target
            const count = Math.min(3, Math.max(2, Math.floor(8 / targets.length)));
            const picked = candidates.sort(() => 0.5 - Math.random()).slice(0, count);

            picked.forEach(p => {
                selected.push(p);
                usedNames.add(p.name);
            });
        });

        // 3. Fallback? If none found
        if (selected.length === 0) {
            console.warn("No exercises found for custom criteria.");
            // Maybe add a placeholder or keep empty?
        }

        setState(prev => ({
            ...prev,
            dailyWorkout: selected,
            customWorkoutActive: true,
            customTargets: targets,
            customEquipment: equipment,
            lastWorkoutDate: new Date().toDateString(), // Mark as new
            isGenerating: false
        }));
    };

    const clearCustomWorkout = () => {
        setState(prev => ({
            ...prev,
            customWorkoutActive: false,
            customTargets: [],
            customEquipment: []
        }));
        // Revert to standard
        setTimeout(() => generateWorkout(state.currentSplit, state.focusArea), 0);
    };

    const getAllExercises = () => {
        return allExercises;
    };

    const excludeExercise = async (exerciseName: string) => {
        // 1. Calculate new state immediately (Optimistic)
        let newExcluded: string[] = [];

        setState(prev => {
            newExcluded = [...prev.excludedExercises, exerciseName];
            const currentWorkout = [...prev.dailyWorkout];
            const index = currentWorkout.findIndex(ex => ex.name === exerciseName);

            if (index !== -1) {
                const removedEx = currentWorkout[index];
                const candidates = getAvailableExercises(prev.equipment)
                    .filter(ex =>
                        !newExcluded.includes(ex.name) &&
                        !currentWorkout.some(w => w.name === ex.name) &&
                        ex.muscleGroup === removedEx.muscleGroup
                    );

                if (candidates.length > 0) {
                    currentWorkout[index] = candidates[Math.floor(Math.random() * candidates.length)];
                } else {
                    const fallback = getAvailableExercises(prev.equipment, prev.currentSplit)
                        .filter(ex => !newExcluded.includes(ex.name) && !currentWorkout.some(w => w.name === ex.name));

                    if (fallback.length > 0) {
                        currentWorkout[index] = fallback[Math.floor(Math.random() * fallback.length)];
                    } else {
                        currentWorkout.splice(index, 1);
                    }
                }
            }
            return { ...prev, excludedExercises: newExcluded, dailyWorkout: currentWorkout };
        });

        // 2. Persist to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // We use 'newExcluded' but we need to rely on the functional update being sync-ish enough? 
            // Variable 'newExcluded' captured in closure of setState might not work if setState runs later?
            // Actually, difficult to save "newExcluded" if calculated inside setState.
            // Better pattern: calculate first, then set.

            // Safest: Use previous state + new item.
            await supabase.from('user_settings').upsert({
                id: user.id,
                excluded_exercises: [...state.excludedExercises, exerciseName]
            });
        }
    };

    const restoreExercise = async (exerciseName: string) => {
        const newExcluded = state.excludedExercises.filter(n => n !== exerciseName);

        setState(prev => ({
            ...prev,
            excludedExercises: newExcluded
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_settings').upsert({
                id: user.id,
                excluded_exercises: newExcluded
            });
        }
    };



    // AI PROFILE UPDATE
    // AI PROFILE UPDATE
    const addCustomExercise = async (prompt: string) => {
        console.log('Creating Custom Exercise from:', prompt);
        try {
            const newEx = await SmartParser.createExerciseFromPrompt(state.openaiApiKey, prompt);

            // Assign ID
            const exObj: Exercise = {
                id: `custom-${Date.now()}`,
                ...newEx,
                category: newEx.category as any, // Cast string to strict Union
                gifUrl: '',
                type: 'Isolation' // Default type required by Exercise interface
            };

            // 1. Update Local State
            setState(prev => {
                const updated = [...prev.customExercises, exObj];
                return {
                    ...prev,
                    customExercises: updated
                };
            });
            setAllExercises(prev => [...prev, exObj]);

            // 2. Persist to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Determine description if possible (it's not on Exercise type yet, but returned by parser)
                const desc = (newEx as any).description || '';

                const { error } = await supabase.from('custom_exercises').insert({
                    user_id: user.id,
                    name: exObj.name,
                    muscle_group: exObj.muscleGroup,
                    equipment: exObj.equipment,
                    category: exObj.category,
                    description: desc
                });

                if (error) {
                    console.error('Failed to save custom exercise to DB:', error);
                    // Optional: Rollback state? For now just log.
                } else {
                    console.log('Custom exercise saved to DB');
                }
            }

            return exObj;
        } catch (e) {
            console.error('Failed to create custom exercise', e);
            throw e;
        }
    };

    const toggleFavorite = (exerciseName: string) => {
        setState(prev => {
            const isFav = prev.favorites.includes(exerciseName);
            return {
                ...prev,
                favorites: isFav
                    ? prev.favorites.filter(n => n !== exerciseName)
                    : [...prev.favorites, exerciseName]
            };
        });
    };

    const deleteCustomExercise = (exerciseName: string) => {
        setState(prev => ({
            ...prev,
            customExercises: prev.customExercises.filter(e => e.name !== exerciseName)
        }));
    };

    const updateUserEquipmentProfile = async (profile: string) => {
        console.log('Updating Equipment Profile:', profile);

        // 1. Update Profile String State
        setState(prev => ({ ...prev, userEquipmentProfile: profile }));

        // 1b. Save Profile to Supabase
        const { data: { user } } = await supabase.auth.getUser();

        if (!profile.trim()) {
            // Clear whitelist if empty
            setState(prev => ({ ...prev, availableExerciseNames: [] }));
            if (user) {
                await supabase.from('user_settings').upsert({
                    id: user.id,
                    user_equipment_profile: profile,
                    available_exercise_names: []
                });
            }
            return;
        }

        // 2. Call AI/Parser to get Whitelist
        const whitelist = await SmartParser.filterExercisesByProfile(state.openaiApiKey, profile, allExercises);
        console.log(`AI Whitelist Generated: ${whitelist.length} exercises valid.`);

        // 3. Update Whitelist State
        setState(prev => ({ ...prev, availableExerciseNames: whitelist }));

        // 4. Save Profile AND Whitelist to Supabase
        if (user) {
            console.log('Saving profile to DB...', { profile, whitelistCount: whitelist.length });
            const { error } = await supabase.from('user_settings').upsert({
                id: user.id,
                user_equipment_profile: profile,
                available_exercise_names: whitelist
            });
            if (error) console.error("Failed to save profile/whitelist to DB:", error);
            else console.log("✅ Profile saved to DB successfully.");
        } else {
            console.warn("⚠️ Cannot save profile: User not logged in.");
        }
    };

    const setOpenaiApiKey = async (key: string) => {
        // 1. Update State
        setState(prev => ({ ...prev, openaiApiKey: key }));
        // Removed localStorage.setItem

        // 2. Force Immediate Save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from('user_settings').upsert({ id: user.id, openai_api_key: key });
            if (error) console.error("Force Save Key Failed:", error);
            else console.log("Force Save Key Success");
        }
    };

    const toggleLegs = async (enabled: boolean) => {
        // 1. Optimistic Update
        setState(prev => {
            let newSplit = prev.currentSplit;
            let newFocus = prev.focusArea;

            if (!enabled) {
                // If disabling legs, and we are currently on Legs split, switch to Push
                if (newSplit === 'Legs') {
                    newSplit = 'Push';
                }
                // If Focus is Legs or Quads/Hamstrings, reset to Default
                if (['Legs', 'Quads', 'Hamstrings', 'Calves', 'Glutes'].includes(newFocus)) {
                    newFocus = 'Default';
                }
            }

            return {
                ...prev,
                includeLegs: enabled,
                currentSplit: newSplit,
                focusArea: newFocus
            };
        });

        // 2. Persist to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_settings').upsert({ id: user.id, include_legs: enabled });
        }

        // 3. Trigger Workout Regen (with Fun Loader)
        setIsGenerating(true);
        setTimeout(() => {
            // Re-evaluate current state logic (simplified)
            let nextSplit = state.currentSplit;
            if (!enabled && nextSplit === 'Legs') nextSplit = 'Push';

            let nextFocus = state.focusArea;
            if (!enabled && ['Legs', 'Quads', 'Hamstrings', 'Calves', 'Glutes'].includes(nextFocus)) nextFocus = 'Default';

            generateWorkout(nextSplit, nextFocus);

            setTimeout(() => setIsGenerating(false), 500);
        }, 2000);
    };

    const testPersistence = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "User not logged in";

        const testKey = `test-key-${Date.now()}`;
        // Write
        await supabase.from('user_settings').upsert({ id: user.id, openai_api_key: testKey });
        // Read
        const { data } = await supabase.from('user_settings').select('openai_api_key').eq('id', user.id).single();
        return data?.openai_api_key === testKey ? "SUCCESS: Read/Write confirmed" : "FAILURE: Read mismatch";
    };

    const setGenerationStatus = (status: string | undefined) => {
        setState(prev => ({ ...prev, generationStatus: status }));
    };

    const setProgramMode = async (mode: 'standard' | 'upper_body_cycle') => {
        // 1. Show Fun Loader
        setIsGenerating(true);

        // 2. Wait for animation
        setTimeout(async () => {
            // 3. Update State
            setState(prev => ({ ...prev, programMode: mode }));

            // 4. Persist to DB
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_settings').upsert({ id: user.id, program_mode: mode });
            }

            // 5. Trigger Regeneration
            // We use 'Default' focus and current split to let the new logic decide
            // If switching TO Cycle, calculateWorkout will handle the override
            generateWorkout(state.currentSplit, 'Default');

            // 6. Hide Loader
            setTimeout(() => setIsGenerating(false), 500);
        }, 2000);
    };

    const value = {
        ...state,
        allExercises: getAllExercises(),
        updateEquipment,
        refreshWorkout,
        getAvailableExercises,
        excludeExercise,
        restoreExercise,
        replaceExercise,
        toggleExerciseCompletion,
        reorderWorkout,
        setFocusArea,
        generateCustomWorkout,
        clearCustomWorkout,
        toggleFavorite,
        addCustomExercise,
        deleteCustomExercise,
        updateUserEquipmentProfile,
        setOpenaiApiKey,
        testPersistence,
        toggleLegs,
        setIsGenerating,
        setGenerationStatus,
        setSplit,
        setProgramMode
    };

    return (
        <WorkoutContext.Provider value={value}>
            <AnimatePresence mode="wait">
                {!isLoaded ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white"
                    >
                        <div className="w-64 space-y-6 text-center">
                            {/* Logo or Icon */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="text-4xl mb-4"
                            >
                                💪
                            </motion.div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${loadingProgress}%` }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                />
                            </div>

                            {/* Text */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-slate-400 font-medium h-6"
                            >
                                Loading...
                            </motion.p>
                        </div>
                    </motion.div>
                ) : (
                    children
                )}
            </AnimatePresence>
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
