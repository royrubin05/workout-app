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

    // Load from storage on mount
    useEffect(() => {
        const init = async () => {
            // Load Storage
            const loaded = loadFromStorage();
            if (loaded) {
                const today = new Date().toDateString();
                const isCompleted = loaded.history?.some((h: WorkoutHistory) => new Date(h.date).toDateString() === today);

                setState(prev => ({
                    ...prev,
                    ...loaded,
                    completedToday: isCompleted || false,
                    currentSplit: loaded.currentSplit || 'Push'
                }));
            }

            // Load API Data
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
        const today = new Date().toDateString();
        if (state.lastWorkoutDate !== today && !state.completedToday) {
            generateWorkout();
        }
    }, [state.lastWorkoutDate, state.equipment, state.completedToday]);

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
            {children}
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
