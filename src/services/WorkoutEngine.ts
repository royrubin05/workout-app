import type { Exercise } from '../data/exercises';
import type { WorkoutExercise, WorkoutHistory } from '../types';
import { ExerciseFilter } from './ExerciseFilter';

interface GenerationParams {
    split?: string;
    focusArea?: string;
    programMode: 'standard' | 'upper_body_cycle';
    cycleIndex: number;
    equipment: string;
    allExercises: Exercise[];
    excludedExercises: string[];
    includeLegs: boolean;
    userProfile?: { enabled: boolean; availableExercises: string[] };
    favorites: string[];
    history: WorkoutHistory[];
    customExercises: Exercise[];
}

export class WorkoutEngine {
    static calculateWorkout(params: GenerationParams): { selectedExercises: WorkoutExercise[], splitToUse: string } {
        const {
            split,
            focusArea,
            programMode,
            cycleIndex,
            equipment,
            allExercises,
            excludedExercises,
            includeLegs,
            userProfile,
            favorites,
            history,
            customExercises
        } = params;

        let splitToUse = split || 'Push'; // Default fallback
        const focusToUse = focusArea || 'Default';

        // Merge custom exercises into allExercises for the engine's scope
        const effectiveExercises = [...allExercises, ...customExercises];

        // --- NEW PROGRAM LOGIC ---
        if (programMode === 'upper_body_cycle' && !focusArea && !split) {
            // Cycle Logic (A, B, C, D)
            const cyclePhase = cycleIndex % 4; // 0-3
            const phaseName = ['Push (Strength)', 'Pull (Hypertrophy)', 'Push (Volume)', 'Pull (Variation)'][cyclePhase];

            const selectedExercises: WorkoutExercise[] = [];

            // Get everything to filter manually
            const available = ExerciseFilter.getAvailableExercises(
                effectiveExercises,
                equipment,
                'Full Body',
                excludedExercises,
                includeLegs,
                userProfile
            );

            // Get Recent Exercises (Last 3 Workouts) to enforce variety
            const recentHistory = history.slice(-3);
            const recentNames = new Set(recentHistory.flatMap(h => h.exercises.map(e => e.name)));

            const pick = (criteria: (ex: Exercise) => boolean, count: number, reps: string) => {
                let candidates = available.filter(criteria).filter(ex => !selectedExercises.find(s => s.name === ex.name));

                // Sort by Priority:
                // 1. (Not Recent) + (Favorite)
                // 2. (Not Recent) + (Not Favorite)
                // 3. (Recent) + (Favorite)  <- For when we run out of fresh moves
                // 4. (Recent) + (Not Favorite)

                candidates.sort((a, b) => {
                    const isFavA = favorites.includes(a.name);
                    const isFavB = favorites.includes(b.name);
                    const isRecentA = recentNames.has(a.name);
                    const isRecentB = recentNames.has(b.name);

                    // Assign scores (Higher is better)
                    const scoreA = (isRecentA ? 0 : 2) + (isFavA ? 1 : 0);
                    const scoreB = (isRecentB ? 0 : 2) + (isFavB ? 1 : 0);

                    if (scoreA > scoreB) return -1;
                    if (scoreA < scoreB) return 1;

                    return 0.5 - Math.random();
                });

                candidates.slice(0, count).forEach(ex => {
                    selectedExercises.push({ ...ex, reps });
                });
            };

            const has = (name: string, part: string | string[]) => {
                const parts = Array.isArray(part) ? part : [part];
                return parts.some(p => name.toLowerCase().includes(p.toLowerCase()));
            };

            if (cyclePhase === 0) { // A: Push Strength
                // 1. Flat Horizontal Press (5-8)
                pick(ex => ex.category === 'Push' && has(ex.name, ['Bench', 'Floor']) && !has(ex.name, 'Incline') && ex.type === 'Compound', 1, '5-8');
                // 2. Vertical Press (5-8)
                pick(ex => ex.category === 'Push' && has(ex.name, ['Overhead', 'Arnold', 'Military']) && ex.type === 'Compound', 1, '5-8');
                // 3. Tricep Extension (Heavy)
                pick(ex => ex.category === 'Push' && ex.muscleGroup === 'Triceps' && has(ex.name, ['Skull', 'Extension', 'Close Grip']), 1, '8-10');
                // Fill remaining
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Push', 5 - selectedExercises.length, '8-12');
            }
            else if (cyclePhase === 1) { // B: Pull Hypertrophy
                // 1. Vertical Pull (High Volume)
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Pull-up', 'Chin-up', 'Lat Pulldown']) && !has(ex.name, 'Neutral'), 1, '10-15');
                // 2. Horizontal Row (Controlled)
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Seated Row', 'Cable', 'Machine']), 1, '10-15');
                // 3. Bicep Curl
                pick(ex => ex.category === 'Pull' && ex.muscleGroup === 'Biceps', 1, '10-15');
                // 4. Rear Delt
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Face Pull', 'Rear Delt']), 1, '12-15');
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Pull', 5 - selectedExercises.length, '10-12');
            }
            else if (cyclePhase === 2) { // C: Push Volume
                // 1. Incline Press
                pick(ex => ex.category === 'Push' && has(ex.name, 'Incline'), 1, '10-15');
                // 2. Vertical Press (Accessory)
                pick(ex => ex.category === 'Push' && has(ex.name, ['Dumbbell Press', 'Machine Press']), 1, '10-15');
                // 3. Lateral Raise
                pick(ex => ex.category === 'Push' && has(ex.name, 'Lateral'), 1, '12-15');
                // 4. Tricep Pushdown
                pick(ex => ex.category === 'Push' && has(ex.name, 'Pushdown'), 1, '12-15');
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Push', 5 - selectedExercises.length, '10-15');
            }
            else if (cyclePhase === 3) { // D: Pull Variation
                // 1. Heavy Row
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Barbell Row', 'T-Bar', 'Pendlay', 'Deadlift']), 1, '8-12');
                // 2. Neutral Vertical Pull
                pick(ex => ex.category === 'Pull' && (has(ex.name, 'Neutral') || has(ex.name, 'Hammer')), 1, '8-12');
                // 3. Hammer Curl
                pick(ex => ex.category === 'Pull' && has(ex.name, 'Hammer Curl'), 1, '10-12');
                // 4. Upper Back/Shrug
                pick(ex => ex.category === 'Pull' && has(ex.name, ['Shrug', 'Face Pull']), 1, '10-12');
                if (selectedExercises.length < 5) pick(ex => ex.category === 'Pull', 5 - selectedExercises.length, '8-12');
            }

            return { selectedExercises, splitToUse: `Cycle: ${phaseName}` };
        }

        // --- STANDARD SPLIT ROTATION ---
        // If split is not provided, determining the next split is actually a stateful operation (based on yesterday),
        // but `calculateWorkout` assumes `split` is passed in OR it uses a default.
        // The Context was handling the "Next Split" logic before calling this.
        // We will assume `split` is correctly passed in `params.split` if the user wanted a specific split.
        // If `params.split` is undefined, we use the fallback logic (Context should ideally pass the intended split).

        // However, looking at Context:
        // if (!split && !focus) { ... calculates splitToUse based on currentSplit ... }
        // We can keep this logic here but need `params.split` to be the *current* split if we are rotating, 
        // OR the *target* split. 
        // In Context: "let splitToUse = split || state.currentSplit;"
        // "if (!split && !focus) { ... splitToUse = splits[(currentIndex + 1) % splits.length] ... }"
        // So if we pass `undefined` as split, it CALCULATES the Next split.

        // Wait, if `params.split` is provided, we use it. If not, we rotate FROM `state.currentSplit`.
        // So we need to know `currentSplit` from the params?
        // Let's assume `params.split` IS the `state.currentSplit`. 
        // But the rotation logic relies on `state.completedToday` usually? 
        // In Context: "if (state.lastWorkoutDate !== today) { ... rotate ... }" is done in useEffect to update state.
        // THEN it calls `calculateWorkout(nextSplit)`.
        // So `calculateWorkout` really just receives the TARGET split.

        // BUT, there is this block in `calculateWorkout` in Context:
        // if (!split && !focus) { ... calculate rotation ... }
        // This seems to handle cases where we just say "Give me a workout" without specifying what kind.

        // To support strict porting:
        // We'll need `currentSplit` in params if we want to rotate. 
        // But simpler: The CALLER (Context) should decide the split and pass it.
        // I will remove the rotation logic from here and expect the Caller to pass the correct `splitToUse`.
        // If Caller passes nothing, we default to 'Push' or whatever is passed.

        splitToUse = split || 'Push';

        const getSlots = (splitName: string) => {
            if (focusToUse && focusToUse !== 'Default' && focusToUse !== 'Bodyweight') {
                if (focusToUse === 'Arms') {
                    return [
                        { type: 'Isolation', muscle: 'Biceps', count: 3 },
                        { type: 'Isolation', muscle: 'Triceps', count: 3 },
                        { type: 'Compound', muscle: 'Shoulders', count: 1 },
                        { type: 'Isolation', muscle: 'Forearms', count: 1 }
                    ];
                }
                return [
                    { type: 'Compound', muscle: focusToUse, count: 3 },
                    { type: 'Isolation', muscle: focusToUse, count: 3 },
                    { type: 'Compound', muscle: focusToUse, count: 2 }
                ];
            }

            if (splitName === 'Push') return [
                { type: 'Compound', muscle: 'Chest', count: 2 },
                { type: 'Compound', muscle: 'Shoulders', count: 2 },
                { type: 'Isolation', muscle: 'Chest', count: 1 },
                { type: 'Isolation', muscle: 'Shoulders', count: 1 },
                { type: 'Isolation', muscle: 'Triceps', count: 2 },
            ];
            if (splitName === 'Pull') return [
                { type: 'Compound', muscle: 'Back', count: 3 },
                { type: 'Isolation', muscle: 'Rear Delts', count: 1 },
                { type: 'Isolation', muscle: 'Biceps', count: 3 },
                { type: 'Isolation', muscle: 'Traps', count: 1 },
            ];
            if (splitName === 'Legs') return [
                { type: 'Compound', muscle: 'Quads', count: 2 },
                { type: 'Compound', muscle: 'Hamstrings', count: 2 },
                { type: 'Compound', muscle: 'Legs', count: 1 },
                { type: 'Isolation', muscle: 'Quads', count: 1 },
                { type: 'Isolation', muscle: 'Hamstrings', count: 1 },
                { type: 'Isolation', muscle: 'Calves', count: 1 },
            ];
            return [
                { type: 'Compound', muscle: 'Legs', count: 2 },
                { type: 'Compound', muscle: 'Chest', count: 2 },
                { type: 'Compound', muscle: 'Back', count: 2 },
                { type: 'Compound', muscle: 'Shoulders', count: 1 },
                { type: 'Isolation', muscle: 'Arms', count: 1 },
            ];
        };

        const slots = getSlots(splitToUse);
        const equipmentToUse = focusToUse === 'Bodyweight' ? 'Bodyweight' : equipment;

        let categoryFilter = splitToUse;
        if (focusToUse && focusToUse !== 'Default' && focusToUse !== 'Bodyweight') {
            categoryFilter = focusToUse;
        }

        const availableForSplit = ExerciseFilter.getAvailableExercises(
            allExercises,
            equipmentToUse,
            categoryFilter,
            excludedExercises,
            includeLegs,
            userProfile
        );

        const selectedExercises: WorkoutExercise[] = [];
        const usedNames = new Set<string>();

        slots.forEach((slot: any) => {
            const candidates = availableForSplit.filter(ex => {
                if (excludedExercises.includes(ex.name)) return false;
                const target = slot.muscle.toLowerCase();
                const exMuscle = ex.muscleGroup.toLowerCase();
                const muscleMatch = exMuscle.includes(target) ||
                    (target === 'arms' && (exMuscle.includes('biceps') || exMuscle.includes('triceps'))) ||
                    (target === 'back' && (exMuscle.includes('lats') || exMuscle.includes('traps')));
                return muscleMatch && !usedNames.has(ex.name);
            });

            const shuffled = candidates.sort((a, b) => {
                const isFavA = favorites.includes(a.name);
                const isFavB = favorites.includes(b.name);
                if (isFavA && !isFavB) return Math.random() < 0.7 ? -1 : 1;
                if (!isFavA && isFavB) return Math.random() < 0.7 ? 1 : -1;
                return 0.5 - Math.random();
            });
            const picked = shuffled.slice(0, slot.count);
            picked.forEach(p => {
                selectedExercises.push(p);
                usedNames.add(p.name);
            });
        });

        if (selectedExercises.length < 8) {
            const fallbackPool = ExerciseFilter.getAvailableExercises(
                allExercises,
                equipmentToUse,
                categoryFilter,
                excludedExercises,
                includeLegs,
                userProfile
            );
            const remaining = fallbackPool
                .filter(ex => !usedNames.has(ex.name) && !excludedExercises.includes(ex.name))
                .sort(() => 0.5 - Math.random())
                .slice(0, 8 - selectedExercises.length);
            selectedExercises.push(...remaining);
        }

        return { selectedExercises, splitToUse };
    }
}
