export interface Exercise {
    id: string;
    name: string;
    equipment: string;
    category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Full Body' | 'Cardio';
    muscleGroup: string;
}

// Base exercises to generate variations from
const BASE_MOVEMENTS = [
    // PUSH (Chest, Shoulders, Triceps)
    { name: 'Bench Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Machine', 'Smith Machine'] },
    { name: 'Incline Bench Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Machine', 'Smith Machine'] },
    { name: 'Decline Bench Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Machine', 'Smith Machine'] },
    { name: 'Overhead Press', category: 'Push', muscles: 'Shoulders', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Machine', 'Smith Machine', 'Bands'] },
    { name: 'Arnold Press', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Kettlebell'] },
    { name: 'Push-ups', category: 'Push', muscles: 'Chest', equipment: ['Bodyweight', 'Bands', 'Weighted Vest'] },
    { name: 'Dips', category: 'Push', muscles: 'Triceps', equipment: ['Bodyweight', 'Weighted', 'Machine', 'Dip Station'] },
    { name: 'Chest Flys', category: 'Push', muscles: 'Chest', equipment: ['Dumbbells', 'Cables', 'Machine', 'Bands'] },
    { name: 'Lateral Raises', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Cables', 'Bands', 'Machine'] },
    { name: 'Front Raises', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Barbell', 'Plate', 'Cables', 'Bands'] },
    { name: 'Tricep Extensions', category: 'Push', muscles: 'Triceps', equipment: ['Dumbbells', 'Cables', 'Barbell', 'Bands'] },
    { name: 'Skullcrushers', category: 'Push', muscles: 'Triceps', equipment: ['Barbell', 'Dumbbells', 'EZ Bar'] },
    { name: 'Tricep Pushdowns', category: 'Push', muscles: 'Triceps', equipment: ['Cables', 'Bands'] },

    // PULL (Back, Biceps, Rear Delts)
    { name: 'Pull-ups', category: 'Pull', muscles: 'Back', equipment: ['Pull-up Bar', 'Assisted Machine'] },
    { name: 'Chin-ups', category: 'Pull', muscles: 'Back', equipment: ['Pull-up Bar', 'Assisted Machine'] },
    { name: 'Bent Over Rows', category: 'Pull', muscles: 'Back', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine', 'Bands'] },
    { name: 'Lat Pulldowns', category: 'Pull', muscles: 'Back', equipment: ['Cable', 'Machine', 'Bands'] },
    { name: 'Seated Rows', category: 'Pull', muscles: 'Back', equipment: ['Cable', 'Machine', 'Bands'] },
    { name: 'Face Pulls', category: 'Pull', muscles: 'Rear Delts', equipment: ['Cable', 'Bands'] },
    { name: 'Bicep Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Barbell', 'Dumbbells', 'Cables', 'Bands', 'EZ Bar', 'Machine'] },
    { name: 'Hammer Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Dumbbells', 'Cables', 'Bands'] },
    { name: 'Preacher Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Barbell', 'Dumbbells', 'Machine', 'EZ Bar'] },
    { name: 'Shrugs', category: 'Pull', muscles: 'Traps', equipment: ['Barbell', 'Dumbbells', 'Smith Machine', 'Trap Bar'] },
    { name: 'Deadlift', category: 'Pull', muscles: 'Back', equipment: ['Barbell', 'Trap Bar', 'Dumbbells', 'Kettlebell'] },
    { name: 'Single Arm Row', category: 'Pull', muscles: 'Back', equipment: ['Dumbbells', 'Kettlebell', 'Cable'] },

    // LEGS (Quads, Hamstrings, Glutes, Calves)
    { name: 'Squat', category: 'Legs', muscles: 'Quads', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine', 'Bodyweight', 'Bands'] },
    { name: 'Front Squat', category: 'Legs', muscles: 'Quads', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine'] },
    { name: 'Lunges', category: 'Legs', muscles: 'Legs', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Smith Machine'] },
    { name: 'Bulgarian Split Squat', category: 'Legs', muscles: 'Legs', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell'] },
    { name: 'Leg Press', category: 'Legs', muscles: 'Legs', equipment: ['Machine'] },
    { name: 'Leg Extensions', category: 'Legs', muscles: 'Quads', equipment: ['Machine', 'Bands'] },
    { name: 'Leg Curls', category: 'Legs', muscles: 'Hamstrings', equipment: ['Machine', 'Bands', 'Dumbbell'] },
    { name: 'Romanian Deadlift', category: 'Legs', muscles: 'Hamstrings', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine', 'Bands'] },
    { name: 'Calf Raises', category: 'Legs', muscles: 'Calves', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Machine', 'Smith Machine'] },
    { name: 'Glute Bridges', category: 'Legs', muscles: 'Glutes', equipment: ['Bodyweight', 'Barbell', 'Dumbbell', 'Bands'] },
    { name: 'Hip Thrusts', category: 'Legs', muscles: 'Glutes', equipment: ['Barbell', 'Dumbbell', 'Machine', 'Smith Machine'] },

    // CORE / CARDIO
    { name: 'Plank', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Weighted'] },
    { name: 'Crunches', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Machine', 'Cable'] },
    { name: 'Leg Raises', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Pull-up Bar', 'Dip Station'] },
    { name: 'Russian Twists', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Dumbbell', 'Kettlebell', 'Plate'] },
    { name: 'Burpees', category: 'Full Body', muscles: 'Full Body', equipment: ['Bodyweight'] },
    { name: 'Kettlebell Swings', category: 'Full Body', muscles: 'Full Body', equipment: ['Kettlebell', 'Dumbbell'] },
    { name: 'Jump Rope', category: 'Cardio', muscles: 'Legs', equipment: ['Jump Rope'] },
];

// Generate the full list
const generateExercises = (): Exercise[] => {
    const exercises: Exercise[] = [];
    let idCounter = 1;

    BASE_MOVEMENTS.forEach(move => {
        move.equipment.forEach(eq => {
            exercises.push({
                id: `ex-${idCounter++}`,
                name: `${eq} ${move.name}`,
                equipment: eq,
                category: move.category as any,
                muscleGroup: move.muscles
            });
        });
    });

    return exercises;
};

export const EXERCISES: Exercise[] = generateExercises();

export const getAllExercises = () => EXERCISES;
