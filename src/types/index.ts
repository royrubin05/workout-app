import type { Exercise } from '../data/exercises';

export interface WorkoutExercise extends Exercise {
    completed?: boolean;
    reps?: string;
    sets?: string;
    notes?: string;
}

export interface WorkoutHistory {
    date: string;
    split: string;
    focusArea?: string;
    exercises: WorkoutExercise[];
}
