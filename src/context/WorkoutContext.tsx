import type { Exercise } from '../data/exercises';
import { EXERCISES } from '../data/exercises';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface WorkoutHistory {
    date: string;
    split: string;
    exercises: Exercise[];
}

interface WorkoutState {
    equipment: string;
    dailyWorkout: Exercise[];
    lastWorkoutDate: string | null;
    history: WorkoutHistory[];
    completedToday: boolean;
    currentSplit: 'Push' | 'Pull' | 'Legs' | 'Full Body';
    excludedExercises: string[];
    connectionStatus: 'connected' | 'disconnected' | 'checking';
    connectionError: string | null;
    lastSyncTime: string | null;
    includeBodyweight: boolean;
}

interface WorkoutContextType extends WorkoutState {
    updateEquipment: (eq: string) => void;
    completeWorkout: () => void;
    refreshWorkout: () => void;
    allExercises: Exercise[];
    getAvailableExercises: (eq: string, category?: string) => Exercise[];
    excludeExercise: (exerciseName: string) => void;
    restoreExercise: (exerciseName: string) => void;
    toggleBodyweight: () => void;
    replaceExercise: (exerciseName: string) => void;
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
        excludedExercises: [],
        connectionStatus: 'checking',
        connectionError: null,
        lastSyncTime: null,
        includeBodyweight: true
    });

    const [isLoaded, setIsLoaded] = useState(false);
    const [apiExercises, setApiExercises] = useState<Exercise[]>([]);

    // Initialize
    useEffect(() => {
        const init = async () => {
            // 1. Load Local Storage (Primary Source)
            const localData = loadFromStorage();
            if (localData) {
                const today = new Date().toDateString();
                const isCompleted = localData.history?.some((h: WorkoutHistory) => new Date(h.date).toDateString() === today);

                setState(prev => ({
                    ...prev,
                    ...localData,
                    completedToday: isCompleted || false,
                    currentSplit: localData.currentSplit || 'Push',
                    excludedExercises: localData.excludedExercises || [],
                    includeBodyweight: localData.includeBodyweight !== undefined ? localData.includeBodyweight : true
                }));
            }

            // 2. Load API Data
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
    }, []);

    // Save to storage on change
    useEffect(() => {
        if (isLoaded) {
            saveToStorage(state);

            // Cloud Sync
            if (supabase) {
                // const user = (supabase.auth as any).getUser(); // Check current user
                // We'll use a separate effect for auth, but here we just fire and forget
                // Actually, we need the user ID. Let's rely on the auth effect below.
            }
        }
    }, [state, isLoaded]);

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

                // 2. Load Cloud Data
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('equipment, excluded_exercises, include_bodyweight')
                    .eq('id', userId)
                    .single();

                // 3. Merge/Update State
                setState(prev => {
                    const newEquipment = settingsData?.equipment || prev.equipment;
                    const newExcluded = settingsData?.excluded_exercises || prev.excludedExercises || [];
                    const newIncludeBodyweight = settingsData?.include_bodyweight !== undefined ? settingsData.include_bodyweight : (prev.includeBodyweight ?? true);
                    return {
                        ...prev,
                        equipment: newEquipment,
                        excludedExercises: newExcluded,
                        includeBodyweight: newIncludeBodyweight,
                        connectionStatus: 'connected',
                        lastSyncTime: new Date().toLocaleTimeString()
                    };
                });

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
        if (!isLoaded) return;

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
                    include_bodyweight: state.includeBodyweight,
                    updated_at: new Date().toISOString()
                });

            setState(prev => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString() }));

            // We don't sync history array in real-time here because it's an append-only log usually.
            // But for this simple app, we might want to.
            // However, the 'workout_history' table is likely rows, not a JSON blob.
            // Let's check the schema if we can, or just stick to settings for now as that's the main pain point.
        };

        // Debounce or just run?
        const timeout = setTimeout(syncToCloud, 2000);
        return () => clearTimeout(timeout);
    }, [state.equipment, state.excludedExercises, state.includeBodyweight]); // Sync on equipment or exclusion change

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
            generateWorkout(state.currentSplit);
        }
    }, [isLoaded, state.lastWorkoutDate, state.completedToday, state.currentSplit, state.dailyWorkout.length]);

    // --- SMART MATCHING LOGIC ---
    const normalizeUserEquipment = (userInput: string): string[] => {
        const rawItems = userInput.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        const mappedItems = new Set<string>();

        // Always include bodyweight IF enabled
        if (state.includeBodyweight) {
            mappedItems.add('body weight');
            mappedItems.add('body only');
            mappedItems.add('bodyweight');
        }

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
        const userEq = normalizeUserEquipment(eqString);

        // Merge Local + API
        const allExercises = [...EXERCISES, ...apiExercises];

        // Deduplicate by name (prefer API version for GIF)
        const uniqueExercises = Array.from(new Map(allExercises.map(item => [item.name, item])).values());

        const filtered = uniqueExercises.filter(ex => {
            // Filter by Category (Split)
            if (category && ex.category !== category && category !== 'Full Body') {
                return false;
            }

            // Smart Equipment Check
            const requiredEq = ex.equipment?.toLowerCase().trim();
            if (!requiredEq) return false;

            // Check if ANY of the user's mapped equipment matches the requirement
            // The API usually lists a single equipment type per exercise (e.g. "dumbbell")
            return userEq.some(u => {
                // Exact match or substring match (but be careful with short strings)
                if (requiredEq.length < 3) return u === requiredEq;
                return requiredEq.includes(u) || u.includes(requiredEq);
            });
        });

        console.log(`getAvailableExercises('${eqString}') -> userEq:`, userEq, 'Count:', uniqueExercises.length, '->', filtered.length);
        return filtered;
    };

    const generateWorkout = (splitOverride?: string) => {
        // --- OPTIMAL PPL TEMPLATE LOGIC ---

        const splitToUse = splitOverride || state.currentSplit;

        // 1. Define Slots for each split
        const getSlots = (split: string) => {
            if (split === 'Push') {
                return [
                    { type: 'Compound', muscle: 'Chest', count: 2 },      // e.g. Bench Press, Incline
                    { type: 'Compound', muscle: 'Shoulders', count: 2 },  // e.g. Overhead Press, Arnold
                    { type: 'Isolation', muscle: 'Chest', count: 1 },     // e.g. Flys
                    { type: 'Isolation', muscle: 'Shoulders', count: 1 }, // e.g. Lateral Raises
                    { type: 'Isolation', muscle: 'Triceps', count: 2 },   // e.g. Extensions, Pushdowns
                ];
            } else if (split === 'Pull') {
                return [
                    { type: 'Compound', muscle: 'Back', count: 3 },       // e.g. Pull-ups, Rows, Lat Pulldowns
                    { type: 'Isolation', muscle: 'Rear Delts', count: 1 },// e.g. Face Pulls
                    { type: 'Isolation', muscle: 'Biceps', count: 3 },    // e.g. Curls, Hammer, Preacher
                    { type: 'Isolation', muscle: 'Traps', count: 1 },     // e.g. Shrugs
                ];
            } else if (split === 'Legs') {
                return [
                    { type: 'Compound', muscle: 'Quads', count: 2 },      // e.g. Squat, Leg Press
                    { type: 'Compound', muscle: 'Hamstrings', count: 2 }, // e.g. RDL, Leg Curls
                    { type: 'Compound', muscle: 'Legs', count: 1 },       // e.g. Lunges
                    { type: 'Isolation', muscle: 'Quads', count: 1 },     // e.g. Extensions
                    { type: 'Isolation', muscle: 'Hamstrings', count: 1 },// e.g. Curls
                    { type: 'Isolation', muscle: 'Calves', count: 1 },    // e.g. Calf Raises
                ];
            }
            // Full Body Fallback
            return [
                { type: 'Compound', muscle: 'Legs', count: 2 },
                { type: 'Compound', muscle: 'Chest', count: 2 },
                { type: 'Compound', muscle: 'Back', count: 2 },
                { type: 'Compound', muscle: 'Shoulders', count: 1 },
                { type: 'Isolation', muscle: 'Arms', count: 1 },
            ];
        };

        // 2. Select Exercises for each slot
        const selectedExercises: Exercise[] = [];
        const usedNames = new Set<string>();

        // Get slots for CURRENT split
        const slots = getSlots(splitToUse);

        // Get ALL available exercises for this split (filtered by equipment & split)
        // Note: getAvailableExercises filters by equipment. We need to filter by split manually or pass it?
        // Actually getAvailableExercises takes (equipment, category).
        // Let's map Split -> Category
        const category = splitToUse === 'Push' ? 'Push' :
            splitToUse === 'Pull' ? 'Pull' :
                splitToUse === 'Legs' ? 'Legs' : 'Full Body';

        const availableForSplit = getAvailableExercises(state.equipment, category);

        // 2. Fill Slots
        slots.forEach(slot => {
            // Get all candidates for this slot
            const candidates = availableForSplit.filter(ex => {
                // Exclude banned exercises
                if (state.excludedExercises.includes(ex.name)) return false;

                // Match Muscle Group
                // Note: Our data has 'muscleGroup' (e.g. Chest) and 'category' (e.g. Push)
                // We need to be flexible with matching.
                const target = slot.muscle.toLowerCase();
                const exMuscle = ex.muscleGroup.toLowerCase();

                // Muscle Match
                const muscleMatch = exMuscle.includes(target) ||
                    (target === 'arms' && (exMuscle.includes('biceps') || exMuscle.includes('triceps'))) ||
                    (target === 'back' && (exMuscle.includes('lats') || exMuscle.includes('traps')));

                // Type Match (Heuristic)
                // Compound usually involves Barbell/Dumbbell/Bodyweight and multi-joint
                // Isolation usually involves Machines/Cables or single-joint
                // This is hard to perfect without specific data, so we'll rely on muscle priority first.

                return muscleMatch && !usedNames.has(ex.name);
            });

            // Shuffle and pick
            const shuffled = candidates.sort(() => 0.5 - Math.random());
            const picked = shuffled.slice(0, slot.count);

            picked.forEach(p => {
                selectedExercises.push(p);
                usedNames.add(p.name);
            });
        });

        // 3. Fallback if slots didn't fill enough (e.g. limited equipment)
        if (selectedExercises.length < 8) {
            const remaining = getAvailableExercises(state.equipment, category)
                .filter(ex => !usedNames.has(ex.name) && !state.excludedExercises.includes(ex.name))
                .sort(() => 0.5 - Math.random())
                .slice(0, 8 - selectedExercises.length);
            selectedExercises.push(...remaining);
        }

        setState(prev => ({
            ...prev,
            dailyWorkout: selectedExercises,
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
        const newHistory = [...state.history, {
            date: today,
            split: state.currentSplit,
            exercises: state.dailyWorkout
        }];

        setState(prev => ({
            ...prev,
            history: newHistory,
            completedToday: true
            // Don't rotate split yet! Wait for next day.
        }));
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
            const category = prev.currentSplit === 'Push' ? 'Push' :
                prev.currentSplit === 'Pull' ? 'Pull' :
                    prev.currentSplit === 'Legs' ? 'Legs' : 'Full Body';

            const candidates = getAvailableExercises(prev.equipment, category).filter(ex =>
                ex.name !== oldExercise.name && // Not the same exercise
                ex.muscleGroup === oldExercise.muscleGroup && // Same muscle group
                !prev.excludedExercises.includes(ex.name) && // Not excluded
                !currentWorkout.some(w => w.name === ex.name) // Not already in workout
            );

            if (candidates.length > 0) {
                const replacement = candidates[Math.floor(Math.random() * candidates.length)];
                currentWorkout[index] = replacement;
                return {
                    ...prev,
                    dailyWorkout: currentWorkout
                };
            }

            return prev; // No replacement found
        });
    };

    const getAllExercises = () => {
        return [...EXERCISES, ...apiExercises];
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

    const toggleBodyweight = () => {
        setState(prev => ({ ...prev, includeBodyweight: !prev.includeBodyweight }));
    };

    return (
        <WorkoutContext.Provider value={{
            ...state,
            updateEquipment,
            completeWorkout,
            refreshWorkout,
            allExercises: getAllExercises(),
            getAvailableExercises,
            excludeExercise,
            restoreExercise,
            toggleBodyweight,
            replaceExercise
        }}>
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
