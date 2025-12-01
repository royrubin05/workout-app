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

// import { supabase } from '../services/supabase';

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
                    currentSplit: localData.currentSplit || 'Push'
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
        }
    }, [state, isLoaded]);

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

    // --- SMART MATCHING LOGIC ---
    const normalizeUserEquipment = (userInput: string): string[] => {
        const rawItems = userInput.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        const mappedItems = new Set<string>();

        // Always include bodyweight
        mappedItems.add('body weight');
        mappedItems.add('body only');
        mappedItems.add('bodyweight');

        rawItems.forEach(item => {
            // Direct match
            mappedItems.add(item);

            // Synonyms & Inferences
            if (item.includes('dumbbell') || item.includes('dumbell') || item.includes('weights')) {
                mappedItems.add('dumbbell');
            }
            if (item.includes('barbell') || item.includes('bar') || item.includes('weights')) {
                mappedItems.add('barbell');
                mappedItems.add('ez curl bar');
                mappedItems.add('e-z curl bar');
            }
            if (item.includes('kettlebell')) {
                mappedItems.add('kettlebells');
            }
            if (item.includes('cable') || item.includes('pulley')) {
                mappedItems.add('cable');
            }
            if (item.includes('machine') || item.includes('gym')) {
                mappedItems.add('machine');
                mappedItems.add('cable');
                mappedItems.add('smith machine');
            }
            if (item.includes('band') || item.includes('resistance')) {
                mappedItems.add('bands');
            }
            if (item.includes('ball') || item.includes('medicine')) {
                mappedItems.add('medicine ball');
                mappedItems.add('exercise ball');
            }
            if (item.includes('bench')) {
                // Bench enables specific dumbbell/barbell moves, but doesn't map to a category directly in this API
                // The API uses 'dumbbell' or 'barbell' as the equipment, not 'bench'.
                // So we don't need to add 'bench' to the equipment list for matching, 
                // but we assume if they have dumbbells + bench, they can do bench press.
            }
            if (item.includes('pull up') || item.includes('pull-up') || item.includes('chin up')) {
                // API usually classifies these as 'body only' or 'body weight'
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

        return uniqueExercises.filter(ex => {
            // Filter by Category (Split)
            if (category && ex.category !== category && category !== 'Full Body') {
                return false;
            }

            // Smart Equipment Check
            const requiredEq = ex.equipment.toLowerCase();

            // Special Case: "Body Only" / "Body Weight"
            if (requiredEq === 'body only' || requiredEq === 'body weight' || requiredEq === 'bodyweight') {
                return true;
            }

            // Check if ANY of the user's mapped equipment matches the requirement
            // The API usually lists a single equipment type per exercise (e.g. "dumbbell")
            return userEq.some(u => requiredEq.includes(u) || u.includes(requiredEq));
        });
    };

    const generateWorkout = () => {
        // --- OPTIMAL PPL TEMPLATE LOGIC ---

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

        const slots = getSlots(state.currentSplit);
        const selectedExercises: Exercise[] = [];
        const usedNames = new Set<string>();

        // 2. Fill Slots
        slots.forEach(slot => {
            // Get all candidates for this slot
            const candidates = getAvailableExercises(state.equipment).filter(ex => {
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
            const remaining = getAvailableExercises(state.equipment, state.currentSplit)
                .filter(ex => !usedNames.has(ex.name))
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
