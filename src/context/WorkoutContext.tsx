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
    });

    // Load from storage on mount
    useEffect(() => {
        const loaded = loadFromStorage();
        if (loaded) {
            // Check if completed today
            const today = new Date().toDateString();
            const isCompleted = loaded.history?.some((h: WorkoutHistory) => new Date(h.date).toDateString() === today);

            setState(prev => ({
                ...prev,
                ...loaded,
                completedToday: isCompleted || false
            }));
        }
    }, []);

    // Save to storage on change
    useEffect(() => {
        saveToStorage(state);
    }, [state]);

    // Generate workout if needed
    useEffect(() => {
        const today = new Date().toDateString();
        if (state.lastWorkoutDate !== today && !state.completedToday) {
            generateWorkout();
        }
    }, [state.lastWorkoutDate, state.equipment, state.completedToday]);

    const getAvailableExercises = (eqString: string) => {
        const userEq = eqString.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        if (!userEq.includes('bodyweight')) userEq.push('bodyweight');

        return EXERCISES.filter(ex => {
            const req = ex.equipment.toLowerCase();
            // Check if user has ALL required equipment for this exercise
            // Actually, usually exercise equipment string is "Dumbbells, Bench" -> requires both.
            // So we check if every item in req.split(',') is in userEq.
            const requirements = req.split(',').map(r => r.trim());
            return requirements.every(r => userEq.some(u => u.includes(r) || r.includes(u)));
        });
    };

    const generateWorkout = () => {
        const available = getAvailableExercises(state.equipment);
        const count = 8;

        // Random selection for now
        // TODO: Implement smarter logic (balance categories)
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        state.dailyWorkout = shuffled.slice(0, count);
        state.lastWorkoutDate = new Date().toDateString();

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

        setState(prev => ({
            ...prev,
            history: newHistory,
            completedToday: true
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
