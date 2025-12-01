import type { Exercise } from '../data/exercises';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST;
const CACHE_KEY = 'fitgen_api_cache_v1';
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface ApiExercise {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    target: string;
}

export const fetchExercisesFromAPI = async (): Promise<ApiExercise[]> => {
    if (!RAPIDAPI_KEY) {
        console.warn('No RapidAPI Key found. Using local data only.');
        return [];
    }

    // Check Cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('Using cached API data');
            return data;
        }
    }

    try {
        const response = await fetch(`https://${RAPIDAPI_HOST}/exercises?limit=1300`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data: ApiExercise[] = await response.json();

        // Cache result
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));

        return data;
    } catch (error) {
        console.error('Failed to fetch from ExerciseDB:', error);
        return [];
    }
};

// Helper to map API data to our internal Exercise format
export const mapApiToInternal = (apiData: ApiExercise[]): Exercise[] => {
    return apiData.map(ex => ({
        id: ex.id,
        name: ex.name.charAt(0).toUpperCase() + ex.name.slice(1),
        equipment: ex.equipment.charAt(0).toUpperCase() + ex.equipment.slice(1),
        category: mapTargetToCategory(ex.bodyPart, ex.target),
        muscleGroup: ex.target,
        gifUrl: ex.gifUrl
    }));
};

const mapTargetToCategory = (bodyPart: string, target: string): any => {
    const pushMuscles = ['chest', 'shoulders', 'triceps'];
    const pullMuscles = ['back', 'lats', 'biceps', 'trapezius'];
    const legMuscles = ['upper legs', 'lower legs', 'glutes', 'quadriceps', 'hamstrings', 'calves'];
    const coreMuscles = ['waist', 'abs'];
    const cardio = ['cardio'];

    if (pushMuscles.some(m => bodyPart.includes(m) || target.includes(m))) return 'Push';
    if (pullMuscles.some(m => bodyPart.includes(m) || target.includes(m))) return 'Pull';
    if (legMuscles.some(m => bodyPart.includes(m) || target.includes(m))) return 'Legs';
    if (coreMuscles.some(m => bodyPart.includes(m) || target.includes(m))) return 'Core';
    if (cardio.some(m => bodyPart.includes(m) || target.includes(m))) return 'Cardio';

    return 'Full Body';
};
