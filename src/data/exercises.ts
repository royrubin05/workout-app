export interface Exercise {
    id: string;
    name: string;
    equipment: string;
    category: string;
}

export const EXERCISES: Exercise[] = [
    // Bodyweight
    { id: 'bw-1', name: 'Push-ups', equipment: 'Bodyweight', category: 'Chest' },
    { id: 'bw-2', name: 'Air Squats', equipment: 'Bodyweight', category: 'Legs' },
    { id: 'bw-3', name: 'Burpees', equipment: 'Bodyweight', category: 'Full Body' },
    { id: 'bw-4', name: 'Plank', equipment: 'Bodyweight', category: 'Core' },
    { id: 'bw-5', name: 'Lunges', equipment: 'Bodyweight', category: 'Legs' },
    { id: 'bw-6', name: 'Glute Bridges', equipment: 'Bodyweight', category: 'Legs' },
    { id: 'bw-7', name: 'Mountain Climbers', equipment: 'Bodyweight', category: 'Core' },
    { id: 'bw-8', name: 'Pull-ups', equipment: 'Pull-up Bar', category: 'Back' },
    { id: 'bw-9', name: 'Chin-ups', equipment: 'Pull-up Bar', category: 'Back' },
    { id: 'bw-10', name: 'Dips', equipment: 'Dip Station', category: 'Triceps' },

    // Dumbbells
    { id: 'db-1', name: 'Dumbbell Bench Press', equipment: 'Dumbbells, Bench', category: 'Chest' },
    { id: 'db-2', name: 'Dumbbell Flys', equipment: 'Dumbbells, Bench', category: 'Chest' },
    { id: 'db-3', name: 'Goblet Squat', equipment: 'Dumbbells', category: 'Legs' },
    { id: 'db-4', name: 'Dumbbell Lunges', equipment: 'Dumbbells', category: 'Legs' },
    { id: 'db-5', name: 'Dumbbell Rows', equipment: 'Dumbbells', category: 'Back' },
    { id: 'db-6', name: 'Dumbbell Shoulder Press', equipment: 'Dumbbells', category: 'Shoulders' },
    { id: 'db-7', name: 'Lateral Raises', equipment: 'Dumbbells', category: 'Shoulders' },
    { id: 'db-8', name: 'Bicep Curls', equipment: 'Dumbbells', category: 'Biceps' },
    { id: 'db-9', name: 'Tricep Extensions', equipment: 'Dumbbells', category: 'Triceps' },
    { id: 'db-10', name: 'Romanian Deadlift', equipment: 'Dumbbells', category: 'Legs' },
    { id: 'db-11', name: 'Arnold Press', equipment: 'Dumbbells', category: 'Shoulders' },
    { id: 'db-12', name: 'Hammer Curls', equipment: 'Dumbbells', category: 'Biceps' },
    { id: 'db-13', name: 'Renegade Rows', equipment: 'Dumbbells', category: 'Back' },
    { id: 'db-14', name: 'Thrusters', equipment: 'Dumbbells', category: 'Full Body' },

    // Barbell
    { id: 'bb-1', name: 'Barbell Bench Press', equipment: 'Barbell, Bench', category: 'Chest' },
    { id: 'bb-2', name: 'Barbell Squat', equipment: 'Barbell, Rack', category: 'Legs' },
    { id: 'bb-3', name: 'Deadlift', equipment: 'Barbell', category: 'Legs' },
    { id: 'bb-4', name: 'Overhead Press', equipment: 'Barbell', category: 'Shoulders' },
    { id: 'bb-5', name: 'Barbell Rows', equipment: 'Barbell', category: 'Back' },
    { id: 'bb-6', name: 'Incline Bench Press', equipment: 'Barbell, Bench', category: 'Chest' },
    { id: 'bb-7', name: 'Front Squat', equipment: 'Barbell, Rack', category: 'Legs' },

    // Kettlebell
    { id: 'kb-1', name: 'Kettlebell Swing', equipment: 'Kettlebell', category: 'Full Body' },
    { id: 'kb-2', name: 'Goblet Squat', equipment: 'Kettlebell', category: 'Legs' },
    { id: 'kb-3', name: 'Turkish Get Up', equipment: 'Kettlebell', category: 'Full Body' },

    // Bands
    { id: 'bd-1', name: 'Band Pull Aparts', equipment: 'Bands', category: 'Shoulders' },
    { id: 'bd-2', name: 'Band Face Pulls', equipment: 'Bands', category: 'Shoulders' },
    { id: 'bd-3', name: 'Band Rows', equipment: 'Bands', category: 'Back' },
];

export const getAllExercises = () => EXERCISES;
