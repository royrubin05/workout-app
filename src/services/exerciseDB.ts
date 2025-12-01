import type { Exercise } from '../data/exercises';

const FREE_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const CACHE_KEY = 'fitgen_api_cache_v2'; // Bump version
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface ApiExercise {
    id: string;
    name: string;
    force: string;
    level: string;
    mechanic: string;
    equipment: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    category: string;
    images: string[];
}

export const fetchExercisesFromAPI = async (): Promise<ApiExercise[]> => {
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
        console.log('Fetching from Free Exercise DB...');
        const response = await fetch(FREE_DB_URL);

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
        console.error('Failed to fetch from Free Exercise DB:', error);
        return [];
    }
};

// Helper to map API data to our internal Exercise format
export const mapApiToInternal = (apiData: ApiExercise[]): Exercise[] => {
    return apiData.map(ex => ({
        id: ex.id,
        name: ex.name,
        equipment: normalizeEquipment(ex.equipment),
        category: mapTargetToCategory(ex.primaryMuscles[0] || '', ex.category),
        muscleGroup: ex.primaryMuscles[0] ? capitalize(ex.primaryMuscles[0]) : 'Full Body',
        gifUrl: ex.images && ex.images.length > 0 ? `${IMAGE_BASE_URL}${ex.images[0]}` : undefined
    }));
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const normalizeEquipment = (eq: string): string => {
    if (!eq) return 'Bodyweight';
    if (eq === 'body only') return 'Bodyweight';
    return capitalize(eq);
};

const mapTargetToCategory = (muscle: string, category: string): any => {
    const pushMuscles = ['chest', 'shoulders', 'triceps'];
    const pullMuscles = ['lats', 'middle back', 'lower back', 'biceps', 'traps', 'forearms'];
    const legMuscles = ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'];
    const coreMuscles = ['abdominals'];


    if (pushMuscles.includes(muscle)) return 'Push';
    if (pullMuscles.includes(muscle)) return 'Pull';
    if (legMuscles.includes(muscle)) return 'Legs';
    if (coreMuscles.includes(muscle)) return 'Core';
    if (category === 'cardio') return 'Cardio';

    return 'Full Body';
};
