import type { Exercise } from '../data/exercises';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend Exercise to include completion status
export interface WorkoutExercise extends Exercise {
    completed?: boolean;
}

// Extend Exercise to include completion status
export interface WorkoutExercise extends Exercise {
    completed?: boolean;
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
}

interface WorkoutContextType extends WorkoutState {
    updateEquipment: (eq: string) => void;
    logWorkout: () => void;
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
    // ...
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
    currentSplit: 'Push',
    focusArea: 'Default',
    excludedExercises: [],
    connectionStatus: 'checking',
    connectionError: null,
    lastSyncTime: null,
    customWorkoutActive: false,
    customTargets: [],
    customEquipment: [],
    favorites: [],
    customExercises: [],
    userEquipmentProfile: '',
    availableExerciseNames: [],
    openaiApiKey: localStorage.getItem('openai_api_key') || ''
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<WorkoutState>(initialState);

    const [isLoaded, setIsLoaded] = useState(false);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Loading Animation Effect
    // Load Exercises from DB on Mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                // 1. Fetch from Supabase
                const { data, error } = await supabase
                    .from('exercises')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    console.log(`Loaded ${data.length} exercises from Supabase`);
                    const dbExercises: Exercise[] = data.map(d => ({
                        name: d.name,
                        category: d.category,
                        muscles: d.muscle_group, // Legacy
                        muscleGroup: d.muscle_group, // Map DB 'muscle_group' -> App 'muscleGroup'
                        equipment: d.equipment,
                        type: 'Compound', // Default for now, or map if DB has it
                        // description: d.description, // Not in Exercise interface yet?
                        id: d.id || `db-${Math.random()}`
                    }));
                    setAllExercises(dbExercises);
                    setState(prev => ({ ...prev, connectionStatus: 'connected' }));
                } else {
                    // 2. Fallback if DB empty (or first run before migration)
                    console.log('DB empty, using static exercises');
                    const staticExercises: Exercise[] = BASE_MOVEMENTS.map((ex: any, i) => ({
                        id: `static-${i}`,
                        name: ex.name,
                        category: ex.category,
                        muscleGroup: ex.muscles, // Map
                        equipment: ex.equipment,
                        type: 'Compound', // Default
                        muscles: ex.muscles
                    }));
                    setAllExercises(staticExercises);
                    setState(prev => ({ ...prev, connectionStatus: 'connected' }));
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

    // Initialize
    useEffect(() => {
        const init = async () => {
            // 1. Fetch Exercises from DB
            let dbExercises: Exercise[] = [];
            if (supabase) {
                const { data } = await supabase.from('exercises').select('*');

                if (data && data.length > 0) {
                    console.log(`📦 Loaded ${data.length} exercises from Supabase.`);
                    dbExercises = data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        equipment: d.equipment,
                        category: d.category,
                        muscleGroup: d.muscle_group,
                        gifUrl: d.gif_url,
                        type: 'Compound' // Default for DB loaded exercises if column missing
                    }));
                    setAllExercises(dbExercises);
                } else {
                    console.log('📭 Database empty. Fetching from External API...');
                    // DB is empty, fetch from API and populate
                    try {
                        const { fetchExercisesFromAPI, mapApiToInternal } = await import('../services/exerciseDB');
                        const apiData = await fetchExercisesFromAPI();

                        if (apiData.length > 0) {
                            const mappedExercises = mapApiToInternal(apiData);
                            console.log(`🚀 Fetched ${mappedExercises.length} exercises from API. Syncing to DB...`);

                            // Prepare for DB insert (map to snake_case columns)
                            const dbInserts = mappedExercises.map(ex => ({
                                id: ex.id,
                                name: ex.name,
                                equipment: ex.equipment,
                                category: ex.category,
                                muscle_group: ex.muscleGroup,
                                gif_url: ex.gifUrl
                            }));

                            // Insert in chunks to avoid payload limits
                            const chunkSize = 100;
                            for (let i = 0; i < dbInserts.length; i += chunkSize) {
                                const chunk = dbInserts.slice(i, i + chunkSize);
                                const { error: insertError } = await supabase.from('exercises').upsert(chunk);
                                if (insertError) console.error('Error syncing chunk:', insertError);
                            }

                            console.log('✅ Sync complete!');
                            setAllExercises(mappedExercises);
                        }
                    } catch (e) {
                        console.error("Failed to auto-populate exercises:", e);
                    }
                }
            }
        };

        init();
        setIsLoaded(true);
    }, []);

    // Save to storage on change
    // REMOVED: User requested NO local storage. Everything is in DB.
    /*
    useEffect(() => {
        if (isLoaded) {
            saveToStorage(state);
        }
    }, [state, isLoaded]);
    */

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

                if (authError) {
                    console.warn('Supabase Login Failed:', authError.message);

                    // Try Auto-Signup if login fails
                    if (authError.message.includes('Invalid login credentials')) {
                        console.log('⚠️ Attempting Auto-Signup...');
                        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                            email: 'roy.rubin@gmail.com',
                            password: 'password123',
                        });

                        if (signUpError) {
                            console.error('Auto-Signup Failed:', signUpError.message);

                            let helpfulMessage = `Login & Signup Failed: ${signUpError.message}`;
                            if (signUpError.message.includes('already registered')) {
                                helpfulMessage = 'Account stuck. Please DELETE user in Supabase Dashboard -> Users.';
                            }

                            setState(prev => ({
                                ...prev,
                                connectionStatus: 'disconnected',
                                connectionError: helpfulMessage
                            }));
                            return;
                        }

                        // If signup worked, we are logged in!
                        // But we might need to wait for session? 
                        // Usually signUp returns session if email confirmation is off.
                        if (signUpData.session) {
                            console.log('✅ Auto-Signup Successful!');
                            // Proceed to load data (which will be empty)
                            // We need to update authData to use this new session
                            // Actually, let's just let the flow continue or recurse?
                            // Simplest is to just set userId here.
                            const userId = signUpData.user?.id;
                            if (userId) {
                                // Proceed to sync (skip load since it's new)
                                setState(prev => ({
                                    ...prev,
                                    connectionStatus: 'connected',
                                    lastSyncTime: new Date().toLocaleTimeString()
                                }));
                                return;
                            }
                        } else {
                            setState(prev => ({
                                ...prev,
                                connectionStatus: 'disconnected',
                                connectionError: 'Signup successful but email confirmation required.'
                            }));
                            return;
                        }
                    }

                    setState(prev => ({
                        ...prev,
                        connectionStatus: 'disconnected',
                        connectionError: authError.message
                    }));
                    return;
                }

                if (!authData?.user) {
                    console.error('Login successful but no user returned');
                    return;
                }

                const userId = authData.user.id;
                console.log('☁️ Connected to Cloud as:', authData.user.email);

                // 2. Load Cloud Data (Settings & State)
                // Added: favorites, user_equipment_profile, custom_exercises
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('equipment, excluded_exercises, current_split, daily_workout, last_workout_date, completed_today, focus_area, favorites, user_equipment_profile, custom_exercises, openai_api_key')
                    .eq('id', userId)
                    .single();

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
                    const newProfile = settingsData?.user_equipment_profile || prev.userEquipmentProfile || '';
                    const newCustom = settingsData?.custom_exercises || prev.customExercises || [];
                    const newApiKey = settingsData?.openai_api_key || prev.openaiApiKey; // Removed localStorage fallback

                    // Restore full state
                    const newSplit = settingsData?.current_split || prev.currentSplit;
                    const newDailyWorkout = settingsData?.daily_workout ? (typeof settingsData.daily_workout === 'string' ? JSON.parse(settingsData.daily_workout) : settingsData.daily_workout) : prev.dailyWorkout;
                    const newLastDate = settingsData?.last_workout_date || prev.lastWorkoutDate;
                    const newCompletedToday = settingsData?.completed_today !== undefined ? settingsData.completed_today : prev.completedToday;
                    // User Request: Always default to 'Standard Split' (Default) on initial load, ignoring saved focus
                    const newFocusArea = 'Default';

                    // Re-calculate local whitelist if profile exists?
                    // We might need to handle this asynchronously after load, OR store the whitelist too?
                    // For now, let's trigger a re-parse if profile exists and whitelist is empty? 
                    // Or rely on updateUserEquipmentProfile being called or manual update?
                    // Actually, if we just load the string, the filter won't work until we have the whitelist.
                    // Ideally we store `available_exercise_names` in DB too, but let's stick to profile string + client re-gen for now if needed.
                    // Better: Trigger updateProfile if we load a profile? Or just fail silently until user hits save?
                    // Let's rely on local storage for the whitelist first (which works), but if we clear local storage...
                    // We'll address whitelist persistence later if requested.

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
                        currentSplit: newSplit,
                        dailyWorkout: newDailyWorkout,
                        lastWorkoutDate: newLastDate,
                        completedToday: newCompletedToday,
                        focusArea: newFocusArea,
                        history: cloudHistory.length > 0 ? cloudHistory : prev.history,
                        connectionStatus: 'connected',
                        lastSyncTime: new Date().toLocaleTimeString(),
                        openaiApiKey: newApiKey
                    };
                });

                // Trigger whitelist update if profile loaded?
                if (settingsData?.user_equipment_profile) {
                    // We'll need access to allExercises, which might not be loaded yet here?
                    // connectToCloud is inside useEffect with dependency []...
                    // Let's just leave it for now.
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
            await supabase
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
                    focus_area: state.focusArea,
                    openai_api_key: state.openaiApiKey,
                    updated_at: new Date().toISOString()
                });

            setState(prev => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString() }));
        };

        // Debounce or just run?
        const timeout = setTimeout(syncToCloud, 2000);
        return () => clearTimeout(timeout);
    }, [state.equipment, state.excludedExercises, state.favorites, state.userEquipmentProfile, state.customExercises, state.currentSplit, state.dailyWorkout, state.lastWorkoutDate, state.completedToday, state.focusArea, state.openaiApiKey]); // Sync on ANY state change

    // Generate workout if needed
    useEffect(() => {
        if (!isLoaded) return; // Wait for API and Storage to load

        const today = new Date().toDateString();


        if (state.lastWorkoutDate !== today) {
            // It's a new day!
            let nextSplit = state.currentSplit;

            // If we completed the last workout, rotate!
            if (state.completedToday) {
                const splits: ('Push' | 'Pull' | 'Legs')[] = ['Push', 'Pull', 'Legs'];
                const currentIdx = splits.indexOf(state.currentSplit as any);
                nextSplit = currentIdx !== -1 ? splits[(currentIdx + 1) % splits.length] : 'Push';
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
            let uniqueExercises = allExercises.filter(ex => state.availableExerciseNames.includes(ex.name));

            if (category && category !== 'Full Body') {
                uniqueExercises = uniqueExercises.filter(ex => ex.category === category);
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
            // Filter by Category (Split)
            if (category && ex.category !== category && category !== 'Full Body') {
                return false;
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

    const generateWorkout = async (splitOverride?: string, focusOverride?: string) => {
        const splitToUse = splitOverride || state.currentSplit;
        const focusToUse = focusOverride || state.focusArea;
        const apiKey = state.openaiApiKey;

        // --- AI GENERATION MODE ---
        if (apiKey && state.userEquipmentProfile) {
            console.log('🤖 Generating AI Workout...');
            try {
                // Get available names for context
                // MERGE: Standard available + Custom Exercises
                const customNames = state.customExercises.map(c => c.name);
                let whitelist = state.availableExerciseNames.length > 0
                    ? state.availableExerciseNames
                    : allExercises.map(e => e.name);

                // Ensure custom exercises are in the whitelist
                whitelist = [...new Set([...whitelist, ...customNames])];

                // If whitelist is empty despite profile, try to generate it on the fly
                if (whitelist.length === 0 && state.userEquipmentProfile) {
                    const generatedWhitelist = await SmartParser.filterExercisesByProfile(state.openaiApiKey, state.userEquipmentProfile, allExercises);
                    if (generatedWhitelist.length > 0) {
                        whitelist = generatedWhitelist;
                        setState(prev => ({ ...prev, availableExerciseNames: whitelist }));
                    }
                }

                const aiPlan = await SmartParser.generateAIWorkout(
                    state.openaiApiKey,
                    splitToUse,
                    focusToUse,
                    state.userEquipmentProfile,
                    whitelist.length > 0 ? whitelist : allExercises.map(e => e.name), // Fallback to all if whitelist fails
                    state.favorites // PASS FAVORITES
                );

                if (aiPlan.length > 0) {
                    // Map AI plan to Exercise objects
                    const mappedWorkout: WorkoutExercise[] = aiPlan.map((step, idx) => {
                        // Find matching DB exercise (Standard OR Custom)
                        const allPool = [...allExercises, ...state.customExercises];
                        const existing = allPool.find(ex => ex.name.toLowerCase() === step.name.toLowerCase())
                            || allPool.find(ex => ex.name.toLowerCase().includes(step.name.toLowerCase()));

                        // Construct Exercise Object
                        return {
                            id: existing?.id || `ai-${idx}-${Date.now()}`,
                            name: existing?.name || step.name,
                            category: existing?.category || splitToUse,
                            muscleGroup: existing?.muscleGroup || focusToUse,
                            equipment: existing?.equipment || 'Bodyweight',
                            gifUrl: existing?.gifUrl,
                            // Store AI Sets/Reps/Notes in a temporary way? 
                            // We don't have these fields in Exercise interface yet.
                            // Let's hack it into 'description' or just trust the user knows.
                            // Ideally we add 'sets', 'reps', 'note' to WorkoutExercise interface?
                            // For now, let's just allow the standard card to show, maybe update name?
                            // "Bench Press (4x5-8)"? No that's ugly.
                            // Let's just return the exercise. The user asked for "Strategy".
                            // If we want to show Sets/Reps, we need UI changes.
                            // For now, just getting the RIGHT exercises is the win.
                            // We will match the existing object.
                            completed: false
                        };
                    });

                    console.log('✅ AI Workout generated:', mappedWorkout.length);
                    setState(prev => ({
                        ...prev,
                        dailyWorkout: mappedWorkout,
                        lastWorkoutDate: new Date().toDateString(),
                        currentSplit: splitToUse // Ensure split is updated if passed
                    }));
                    return; // EXIT EARLY
                }
            } catch (e) {
                console.error("AI Generation Failed, using fallback:", e);
            }
        }

        // --- HEURISTIC FALLBACK (Existing Logic) ---
        console.log('⚠️ Using Heuristic Fallback Workout...');

        // 1. Define Slots for each split
        const getSlots = (split: string) => {
            // ... (Existing Slot Logic) ...
            // Copying existing content to ensure we don't lose it if I replaced the whole function block.
            // Since I am replacing lines 560-702, I need to ensure I don't delete the fallback logic.
            // I will paste the original logic below.

            // Base Slots
            let slots: { type: string, muscle: string, count: number }[] = [];

            if (split === 'Push') {
                slots = [
                    { type: 'Compound', muscle: 'Chest', count: 2 },
                    { type: 'Compound', muscle: 'Shoulders', count: 2 },
                    { type: 'Isolation', muscle: 'Chest', count: 1 },
                    { type: 'Isolation', muscle: 'Shoulders', count: 1 },
                    { type: 'Isolation', muscle: 'Triceps', count: 2 },
                ];
            } else if (split === 'Pull') {
                slots = [
                    { type: 'Compound', muscle: 'Back', count: 3 },
                    { type: 'Isolation', muscle: 'Rear Delts', count: 1 },
                    { type: 'Isolation', muscle: 'Biceps', count: 3 },
                    { type: 'Isolation', muscle: 'Traps', count: 1 },
                ];
            } else if (split === 'Legs') {
                slots = [
                    { type: 'Compound', muscle: 'Quads', count: 2 },
                    { type: 'Compound', muscle: 'Hamstrings', count: 2 },
                    { type: 'Compound', muscle: 'Legs', count: 1 },
                    { type: 'Isolation', muscle: 'Quads', count: 1 },
                    { type: 'Isolation', muscle: 'Hamstrings', count: 1 },
                    { type: 'Isolation', muscle: 'Calves', count: 1 },
                ];
            } else {
                // Full Body
                slots = [
                    { type: 'Compound', muscle: 'Legs', count: 2 },
                    { type: 'Compound', muscle: 'Chest', count: 2 },
                    { type: 'Compound', muscle: 'Back', count: 2 },
                    { type: 'Compound', muscle: 'Shoulders', count: 1 },
                    { type: 'Isolation', muscle: 'Arms', count: 1 },
                ];
            }

            // --- FOCUS AREA OVERRIDE LOGIC ---
            if (focusToUse && focusToUse !== 'Default') {
                // Strategy: Add 2 extra slots for the focus area
                slots.unshift({ type: 'Compound', muscle: focusToUse, count: 1 });
                slots.push({ type: 'Isolation', muscle: focusToUse, count: 1 });
            }

            return slots;
        };

        const selectedExercises: Exercise[] = [];
        const usedNames = new Set<string>();
        const slots = getSlots(splitToUse);
        const equipmentToUse = focusToUse === 'Bodyweight' ? 'Bodyweight' : state.equipment;
        // Use legacy or new getAvailableExercises? 
        // We modified getAvailableExercises to check for profile. 
        // If profile exists, it uses profile. If not, it uses eqString.
        // So passing equipmentToUse works for both cases (it is ignored if profile active).
        const availableForSplit = getAvailableExercises(equipmentToUse, 'Full Body');

        // 2. Fill Slots
        slots.forEach(slot => {
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

        // 3. Fallback Fill
        if (selectedExercises.length < 8) {
            const remaining = getAvailableExercises(equipmentToUse, splitToUse)
                .filter(ex => !usedNames.has(ex.name) && !state.excludedExercises.includes(ex.name))
                .sort(() => 0.5 - Math.random())
                .slice(0, 8 - selectedExercises.length);
            selectedExercises.push(...remaining);
        }

        setState(prev => ({
            ...prev,
            dailyWorkout: selectedExercises,
            lastWorkoutDate: new Date().toDateString(),
            currentSplit: splitToUse
        }));
    };

    const updateEquipment = (eq: string) => {
        setState(prev => ({ ...prev, equipment: eq }));
        // Optionally regenerate workout immediately
        // generateWorkout(); 
    };

    const logWorkout = async () => {
        const today = new Date().toISOString();

        // Only log if at least one exercise is completed
        const completedExercises = state.dailyWorkout.filter(ex => ex.completed);
        if (completedExercises.length === 0) return;


        // Actually, let's log the whole workout state so we know what was skipped.
        const historyEntry = {
            date: today,
            split: state.currentSplit,
            focusArea: state.focusArea,
            exercises: completedExercises // Only save COMPLETED exercises
        };

        const newHistory = [...state.history, historyEntry];

        setState(prev => ({
            ...prev,
            history: newHistory,
            completedToday: true
            // Don't rotate split yet! Wait for next day.
        }));

        // Sync to Cloud immediately
        if (state.connectionStatus === 'connected') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('workout_history').insert({
                    user_id: user.id,
                    date: today,
                    split: state.currentSplit,
                    exercises: state.dailyWorkout
                });
            }
        }
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

    const toggleExerciseCompletion = (exerciseName: string) => {
        setState(prev => {
            const newDaily = prev.dailyWorkout.map(ex =>
                ex.name === exerciseName ? { ...ex, completed: !ex.completed } : ex
            );
            const hasCompleted = newDaily.some(ex => ex.completed);

            return {
                ...prev,
                dailyWorkout: newDaily,
                completedToday: hasCompleted,
                lastWorkoutDate: hasCompleted ? new Date().toDateString() : prev.lastWorkoutDate
            };
        });
    };

    const reorderWorkout = (newOrder: WorkoutExercise[]) => {
        setState(prev => ({
            ...prev,
            dailyWorkout: newOrder
        }));
    };

    const setFocusArea = (area: string) => {
        // 1. Capture currently completed exercises to prevent data loss on switch
        const completedEx = state.dailyWorkout.filter(e => e.completed);

        setState(prev => {
            const newState = { ...prev, focusArea: area };

            // If the user has done some work, archive it to history before we wipe the slate
            if (completedEx.length > 0) {
                const historyEntry: WorkoutHistory = {
                    date: new Date().toISOString(),
                    split: prev.currentSplit,
                    focusArea: prev.focusArea, // Log under the OLD focus area
                    exercises: completedEx
                };
                newState.history = [...prev.history, historyEntry];
                newState.completedToday = true;

                // Trigger sync effectively by updating state
                newState.lastSyncTime = null; // Force sync check if needed, or rely on effect deps
            }
            return newState;
        });

        // 2. Regenerate with new focus
        setTimeout(() => generateWorkout(state.currentSplit, area), 0);
    };

    const generateCustomWorkout = (targets: string[], equipment: string[]) => {
        console.log('Generating Custom Workout for:', targets, equipment);

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
            lastWorkoutDate: new Date().toDateString() // Mark as new
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

    const excludeExercise = (exerciseName: string) => {
        setState(prev => {
            const newExcluded = [...prev.excludedExercises, exerciseName];

            // Replace in current workout if present
            const currentWorkout = [...prev.dailyWorkout];
            const index = currentWorkout.findIndex(ex => ex.name === exerciseName);

            if (index !== -1) {
                const removedEx = currentWorkout[index];
                // Find replacement
                const candidates = getAvailableExercises(prev.equipment)
                    .filter(ex =>
                        !newExcluded.includes(ex.name) &&
                        !currentWorkout.some(w => w.name === ex.name) &&
                        ex.muscleGroup === removedEx.muscleGroup
                    );

                if (candidates.length > 0) {
                    // Pick random
                    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
                    currentWorkout[index] = replacement;
                } else {
                    // If no direct muscle match, try same category/split? Or just remove?
                    // Let's try to keep count same if possible, or just leave it empty?
                    // For now, if no replacement, we might just have to shrink the workout or pick *any* available.
                    // Let's pick any available that fits the split.
                    const fallback = getAvailableExercises(prev.equipment, prev.currentSplit)
                        .filter(ex => !newExcluded.includes(ex.name) && !currentWorkout.some(w => w.name === ex.name));

                    if (fallback.length > 0) {
                        currentWorkout[index] = fallback[Math.floor(Math.random() * fallback.length)];
                    } else {
                        // Worst case, remove it
                        currentWorkout.splice(index, 1);
                    }
                }
            }

            return {
                ...prev,
                excludedExercises: newExcluded,
                dailyWorkout: currentWorkout
            };
        });
    };

    const restoreExercise = (exerciseName: string) => {
        setState(prev => ({
            ...prev,
            excludedExercises: prev.excludedExercises.filter(n => n !== exerciseName)
        }));
    };

    // AI PROFILE UPDATE
    const addCustomExercise = async (prompt: string) => {
        console.log('Creating Custom Exercise from:', prompt);
        try {
            const newEx = await SmartParser.createExerciseFromPrompt(state.openaiApiKey, prompt);

            // Assign ID
            const exObj: Exercise = {
                id: `custom-${Date.now()}`,
                ...newEx,
                gifUrl: '' // No GIF for custom yet
            };

            setState(prev => {
                const updated = [...prev.customExercises, exObj];
                return {
                    ...prev,
                    customExercises: updated
                };
            });
            // Also add to all available exercises so it appears immediately
            setAllExercises(prev => [...prev, exObj]);
            // Note: In a real app we might want to dedupe or handle this better, 
            // but for now this ensures immediate availability.

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
        localStorage.setItem('user_equipment_profile', profile);

        if (!profile.trim()) {
            // Clear whitelist if empty
            setState(prev => ({ ...prev, availableExerciseNames: [] }));
            localStorage.setItem('available_exercise_names', '[]');
            return;
        }

        // 2. Call AI/Parser to get Whitelist
        const whitelist = await SmartParser.filterExercisesByProfile(state.openaiApiKey, profile, allExercises);
        console.log(`AI Whitelist Generated: ${whitelist.length} exercises valid.`);

        // 3. Update Whitelist State
        setState(prev => ({ ...prev, availableExerciseNames: whitelist }));
        localStorage.setItem('available_exercise_names', JSON.stringify(whitelist));

        // 4. Regenerate Workout with new pool
        // setTimeout(() => generateWorkout(state.currentSplit), 100);
    };

    const setOpenaiApiKey = (key: string) => {
        setState(prev => ({ ...prev, openaiApiKey: key }));
        localStorage.setItem('openai_api_key', key); // Keep local backup
    };

    const value = {
        ...state,
        allExercises: getAllExercises(),
        updateEquipment,
        logWorkout,
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
        setOpenaiApiKey
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
