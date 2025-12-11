export interface Exercise {
    id: string;
    name: string;
    equipment: string | string[]; // Allow both for backward compatibility
    category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Full Body' | 'Cardio';
    muscleGroup: string;
    type: 'Compound' | 'Isolation';
    gifUrl?: string; // Optional
    muscles?: string; // Legacy support
}

// Base exercises to generate variations from
export const BASE_MOVEMENTS = [
    // PUSH (Chest, Shoulders, Triceps)
    { name: 'Bench Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Machine', 'Smith Machine', 'Bands'] },
    { name: 'Incline Bench Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Machine', 'Smith Machine', 'Bands'] },
    { name: 'Decline Bench Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Machine', 'Smith Machine'] },
    { name: 'Floor Press', category: 'Push', muscles: 'Chest', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine'] },
    { name: 'Overhead Press', category: 'Push', muscles: 'Shoulders', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Machine', 'Smith Machine', 'Bands', 'Plate'] },
    { name: 'Arnold Press', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Kettlebell'] },
    { name: 'Push-ups', category: 'Push', muscles: 'Chest', equipment: ['Bodyweight', 'Bands', 'Weighted Vest', 'Decline', 'Incline'] },
    { name: 'Dips', category: 'Push', muscles: 'Triceps', equipment: ['Weighted', 'Machine', 'Dip Station', 'Bench'] },
    { name: 'Chest Flys', category: 'Push', muscles: 'Chest', equipment: ['Dumbbells', 'Cables', 'Machine', 'Bands', 'Pec Deck'] },
    { name: 'Lateral Raises', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Cables', 'Bands', 'Machine', 'Plate', 'Kettlebell'] },
    { name: 'Front Raises', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Barbell', 'Plate', 'Cables', 'Bands', 'Kettlebell'] },
    { name: 'Rear Delt Flys', category: 'Push', muscles: 'Shoulders', equipment: ['Dumbbells', 'Cables', 'Machine', 'Bands'] },
    { name: 'Upright Rows', category: 'Push', muscles: 'Shoulders', equipment: ['Barbell', 'Dumbbells', 'Cables', 'Smith Machine', 'Bands'] },
    { name: 'Tricep Extensions', category: 'Push', muscles: 'Triceps', equipment: ['Dumbbells', 'Cables', 'Barbell', 'Bands', 'Machine'] },
    { name: 'Skullcrushers', category: 'Push', muscles: 'Triceps', equipment: ['Barbell', 'Dumbbells', 'EZ Bar', 'Cables'] },
    { name: 'Tricep Pushdowns', category: 'Push', muscles: 'Triceps', equipment: ['Cables', 'Bands'] },
    { name: 'Tricep Kickbacks', category: 'Push', muscles: 'Triceps', equipment: ['Dumbbells', 'Cables', 'Bands'] },
    { name: 'Close Grip Bench Press', category: 'Push', muscles: 'Triceps', equipment: ['Barbell', 'Smith Machine', 'Dumbbells'] },

    // PULL (Back, Biceps, Rear Delts)
    { name: 'Pull-ups', category: 'Pull', muscles: 'Back', equipment: ['Pull-up Bar', 'Assisted Machine', 'Weighted'] },
    { name: 'Chin-ups', category: 'Pull', muscles: 'Back', equipment: ['Pull-up Bar', 'Assisted Machine', 'Weighted'] },
    { name: 'Bent Over Rows', category: 'Pull', muscles: 'Back', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine', 'Bands', 'T-Bar'] },
    { name: 'Lat Pulldowns', category: 'Pull', muscles: 'Back', equipment: ['Cable', 'Machine', 'Bands'] },
    { name: 'Neutral Grip Lat Pulldown', category: 'Pull', muscles: 'Back', equipment: ['Cable', 'Machine', 'Bands'] },
    { name: 'Seated Rows', category: 'Pull', muscles: 'Back', equipment: ['Cable', 'Machine', 'Bands'] },
    { name: 'Hammer Strength Row', category: 'Pull', muscles: 'Back', equipment: ['Machine'] },
    { name: 'Face Pulls', category: 'Pull', muscles: 'Rear Delts', equipment: ['Cable', 'Bands'] },
    { name: 'Bicep Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Barbell', 'Dumbbells', 'Cables', 'Bands', 'EZ Bar', 'Machine', 'Plate'] },
    { name: 'Neutral Grip Pull-ups', category: 'Pull', muscles: 'Back', equipment: ['Pull-up Bar', 'Assisted Machine', 'Weighted'] },
    { name: 'Hammer Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Dumbbells', 'Cables', 'Bands', 'Rope'] },
    { name: 'Preacher Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Barbell', 'Dumbbells', 'Machine', 'EZ Bar'] },
    { name: 'Concentration Curls', category: 'Pull', muscles: 'Biceps', equipment: ['Dumbbells', 'Kettlebell'] },
    { name: 'Shrugs', category: 'Pull', muscles: 'Traps', equipment: ['Barbell', 'Dumbbells', 'Smith Machine', 'Trap Bar', 'Cables', 'Plate'] },
    { name: 'Deadlift', category: 'Pull', muscles: 'Back', equipment: ['Barbell', 'Trap Bar', 'Dumbbells', 'Kettlebell', 'Smith Machine'] },
    { name: 'Single Arm Row', category: 'Pull', muscles: 'Back', equipment: ['Dumbbells', 'Kettlebell', 'Cable', 'Machine'] },
    { name: 'Pullover', category: 'Pull', muscles: 'Back', equipment: ['Dumbbell', 'Barbell', 'Cable', 'Machine'] },
    { name: 'Good Mornings', category: 'Pull', muscles: 'Back', equipment: ['Barbell', 'Bands', 'Smith Machine'] },
    { name: 'Hyperextensions', category: 'Pull', muscles: 'Back', equipment: ['Weighted', 'Machine'] },

    // LEGS (Quads, Hamstrings, Glutes, Calves)
    { name: 'Squat', category: 'Legs', muscles: 'Quads', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine', 'Bodyweight', 'Bands', 'Safety Bar'] },
    { name: 'Front Squat', category: 'Legs', muscles: 'Quads', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine'] },
    { name: 'Lunges', category: 'Legs', muscles: 'Legs', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Smith Machine', 'Sandbag'] },
    { name: 'Reverse Lunges', category: 'Legs', muscles: 'Legs', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Smith Machine'] },
    { name: 'Side Lunges', category: 'Legs', muscles: 'Legs', equipment: ['Bodyweight', 'Dumbbells', 'Kettlebell'] },
    { name: 'Bulgarian Split Squat', category: 'Legs', muscles: 'Legs', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Smith Machine'] },
    { name: 'Step-ups', category: 'Legs', muscles: 'Legs', equipment: ['Dumbbells', 'Barbell', 'Kettlebell', 'Box'] },
    { name: 'Leg Press', category: 'Legs', muscles: 'Legs', equipment: ['Machine'] },
    { name: 'Hack Squat', category: 'Legs', muscles: 'Quads', equipment: ['Machine', 'Barbell'] },
    { name: 'Leg Extensions', category: 'Legs', muscles: 'Quads', equipment: ['Machine', 'Bands'] },
    { name: 'Leg Curls', category: 'Legs', muscles: 'Hamstrings', equipment: ['Machine', 'Bands', 'Dumbbell', 'Slider'] },
    { name: 'Romanian Deadlift', category: 'Legs', muscles: 'Hamstrings', equipment: ['Barbell', 'Dumbbells', 'Kettlebell', 'Smith Machine', 'Bands', 'Trap Bar'] },
    { name: 'Calf Raises', category: 'Legs', muscles: 'Calves', equipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Machine', 'Smith Machine', 'Leg Press'] },
    { name: 'Glute Bridges', category: 'Legs', muscles: 'Glutes', equipment: ['Bodyweight', 'Barbell', 'Dumbbell', 'Bands', 'Machine'] },
    { name: 'Hip Thrusts', category: 'Legs', muscles: 'Glutes', equipment: ['Barbell', 'Dumbbell', 'Machine', 'Smith Machine', 'Bands'] },
    { name: 'Goblet Squat', category: 'Legs', muscles: 'Quads', equipment: ['Dumbbell', 'Kettlebell'] },
    { name: 'Sumo Squat', category: 'Legs', muscles: 'Legs', equipment: ['Barbell', 'Dumbbell', 'Kettlebell', 'Smith Machine'] },

    // CORE / CARDIO
    { name: 'Plank', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Weighted'] },
    { name: 'Side Plank', category: 'Core', muscles: 'Core', equipment: ['Bodyweight'] },
    { name: 'Crunches', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Machine', 'Cable', 'Ball'] },
    { name: 'Sit-ups', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Weighted', 'Decline Bench'] },
    { name: 'Leg Raises', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Pull-up Bar', 'Dip Station', 'Bench'] },
    { name: 'Russian Twists', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Dumbbell', 'Kettlebell', 'Plate', 'Ball'] },
    { name: 'Mountain Climbers', category: 'Core', muscles: 'Core', equipment: ['Bodyweight', 'Sliders'] },
    { name: 'Bicycle Crunches', category: 'Core', muscles: 'Core', equipment: ['Bodyweight'] },
    { name: 'Ab Rollouts', category: 'Core', muscles: 'Core', equipment: ['Ab Wheel', 'Barbell'] },
    { name: 'Burpees', category: 'Full Body', muscles: 'Full Body', equipment: ['Bodyweight'] },
    { name: 'Jumping Jacks', category: 'Cardio', muscles: 'Full Body', equipment: ['Bodyweight'] },
    { name: 'Kettlebell Swings', category: 'Full Body', muscles: 'Full Body', equipment: ['Kettlebell', 'Dumbbell'] },
    { name: 'Jump Rope', category: 'Cardio', muscles: 'Legs', equipment: ['Jump Rope'] },
    { name: 'Box Jumps', category: 'Cardio', muscles: 'Legs', equipment: ['Box'] },
    { name: 'Battle Ropes', category: 'Cardio', muscles: 'Full Body', equipment: ['Ropes'] },
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
                muscleGroup: move.muscles,
                type: (['Squat', 'Deadlift', 'Press', 'Row', 'Pull-up', 'Chin-up', 'Dip', 'Lunge', 'Push-up', 'Burpee', 'Clean', 'Snatch', 'Thruster'].some(k => move.name.includes(k))) ? 'Compound' : 'Isolation'
            });
        });
    });

    return exercises;
};

export const EXERCISES: Exercise[] = generateExercises();

export const getAllExercises = () => EXERCISES;
