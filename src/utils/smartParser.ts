/**
 * Smart Parser Utility
 * simulates "AI" analysis using heuristic keyword matching and regex patterns.
 * This runs entirely client-side, ensuring privacy and zero latency.
 */

// Heuristic Knowledge Base
const KEYWORDS = {
    // Muscle Groups
    chest: ['bench', 'chest', 'fly', 'pushups', 'push-up', 'pectoral', 'dip', 'press'],
    back: ['row', 'pull', 'chin', 'lat', 'deadlift', 'back', 'shrug'],
    legs: ['squat', 'lunge', 'leg', 'calf', 'calves', 'glute', 'hamstring', 'quad', 'deadlift', 'step'],
    shoulders: ['shoulder', 'press', 'raise', 'delt', 'upright', 'face pull'],
    arms: ['curl', 'bicep', 'tricep', 'skull', 'extension', 'pushdown', 'dip', 'kickback'],
    core: ['abs', 'crunch', 'plank', 'leg raise', 'russia', 'situp'],
    cardio: ['run', 'jump', 'burpee', 'cardio', 'sprint'],

    // Equipment
    dumbbells: ['dumbbell', 'dumbell', 'db', 'weights', 'free weights'],
    barbell: ['barbell', 'bar', 'bb', 'bench press station'],
    cables: ['cable', 'pulley', 'machine', 'tower'],
    bodyweight: ['body', 'calisthenic', 'no equipment', 'floor', 'mat'],
    machine: ['machine', 'hammer strength', 'smith'],
    kettlebell: ['kettlebell', 'kb'],
    bands: ['band', 'elastic', 'resistance']
};

export const SmartParser = {
    /**
     * Guesses the properties of an exercise based on its name.
     */
    classifyExercise: (name: string) => {
        const lower = name.toLowerCase();

        let muscleGroup = 'Full Body'; // Default
        let category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Full Body' | 'Cardio' = 'Full Body';
        let equipment = 'Bodyweight';

        // 1. Detect Muscle Group
        if (KEYWORDS.chest.some(k => lower.includes(k))) muscleGroup = 'Chest';
        else if (KEYWORDS.back.some(k => lower.includes(k))) muscleGroup = 'Back';
        else if (KEYWORDS.legs.some(k => lower.includes(k))) muscleGroup = 'Legs';
        else if (KEYWORDS.shoulders.some(k => lower.includes(k))) muscleGroup = 'Shoulders';
        else if (KEYWORDS.arms.some(k => lower.includes(k))) {
            muscleGroup = lower.includes('tricep') || lower.includes('skull') || lower.includes('pushdown') ? 'Triceps' : 'Biceps';
        }
        else if (KEYWORDS.core.some(k => lower.includes(k))) muscleGroup = 'Abs';

        // 2. Detect Category (Push/Pull/Legs/etc)
        if (muscleGroup === 'Chest' || muscleGroup === 'Shoulders' || muscleGroup === 'Triceps') category = 'Push';
        else if (muscleGroup === 'Back' || muscleGroup === 'Biceps') category = 'Pull';
        else if (muscleGroup === 'Legs') category = 'Legs';
        else if (muscleGroup === 'Abs') category = 'Core';

        // 3. Detect Equipment Context
        // If nothing specified in name, default to common sense or what was passed?
        // We usually can't tell equipment just from "Curl" (could be DB or BB).
        // Defaulting to "Dumbbells" for isolation is often safe, or "Bodyweight" for calisthenics names.
        if (lower.includes('barbell')) equipment = 'Barbell';
        else if (lower.includes('dumbbell')) equipment = 'Dumbbells';
        else if (lower.includes('cable')) equipment = 'Cables';
        else if (lower.includes('machine')) equipment = 'Machine';
        else if (lower.includes('band')) equipment = 'Bands';
        else if (lower.includes('kettle')) equipment = 'Kettlebell';

        return { muscleGroup, category, equipment };
    },

    /**
     * Parses a free-form user prompt to identify available equipment.
     */
    parseEquipmentPrompt: (text: string): string[] => {
        const lower = text.toLowerCase();
        const detected: string[] = [];

        if (KEYWORDS.dumbbells.some(k => lower.includes(k))) detected.push('Dumbbells');
        if (KEYWORDS.barbell.some(k => lower.includes(k))) detected.push('Barbell');
        if (KEYWORDS.cables.some(k => lower.includes(k))) detected.push('Cables');
        if (KEYWORDS.machine.some(k => lower.includes(k))) detected.push('Machine');
        if (KEYWORDS.kettlebell.some(k => lower.includes(k))) detected.push('Kettlebell');
        if (KEYWORDS.bands.some(k => lower.includes(k))) detected.push('Bands');

        // Always assume Bodyweight is possible unless explicitly excluded? 
        // Or if they say "I have nothing", map to Bodyweight.
        if (detected.length === 0 || lower.includes('body') || lower.includes('nothing') || lower.includes('none')) {
            detected.push('Bodyweight');
        }

        return Array.from(new Set(detected)); // De-dupe
    }
};
