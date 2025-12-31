import type { Exercise } from '../data/exercises';

export class ExerciseFilter {
    /**
     * Normalizes a raw user equipment string into a standardized list of available equipment.
     */
    static normalizeUserEquipment(userInput: string): string[] {
        const rawItems = userInput.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        const mappedItems = new Set<string>();

        // Always include bodyweight
        mappedItems.add('body weight');
        mappedItems.add('body only');
        mappedItems.add('bodyweight');

        rawItems.forEach(item => {
            // Direct match (cleaned)
            mappedItems.add(item);
            mappedItems.add(item.replace(/\s+/g, '')); // Add "kettlebells" from "kettle bells"

            // Synonyms & Inferences
            if (item.includes('dumb')) {
                mappedItems.add('dumbbell');
                mappedItems.add('dumbbells');
            }
            if (item.includes('bar') && !item.includes('cable') && !item.includes('pull')) {
                mappedItems.add('barbell');
                mappedItems.add('ez curl bar');
                mappedItems.add('ez bar');
            }
            if (item.includes('kettle')) {
                mappedItems.add('kettlebell');
                mappedItems.add('kettlebells');
            }
            if (item.includes('cable') || item.includes('pulley') || item.includes('rope')) {
                mappedItems.add('cable');
                mappedItems.add('cables');
            }
            if ((item.includes('machine') || item.includes('gym') || item.includes('pec')) && !item.includes('cable')) {
                mappedItems.add('machine');
                mappedItems.add('smith machine');
            }
            if (item.includes('band') || item.includes('resistance')) {
                mappedItems.add('bands');
                mappedItems.add('band');
            }
            if (item.includes('ball') || item.includes('medicine')) {
                mappedItems.add('medicine ball');
                mappedItems.add('exercise ball');
            }
            if (item.includes('bench')) {
                mappedItems.add('bench');
            }
            if (item.includes('box') || item.includes('step')) {
                mappedItems.add('box');
            }
            if (item.includes('plate')) {
                mappedItems.add('plate');
            }
            if (item.includes('pull') && (item.includes('up') || item.includes('bar'))) {
                mappedItems.add('pull-up bar');
            }
        });

        return Array.from(mappedItems);
    }

    /**
     * Filters the full list of exercises based on user criteria.
     */
    static getAvailableExercises(
        allExercises: Exercise[],
        equipmentString: string,
        category: string | undefined, // 'Push', 'Pull', 'Legs', 'Full Body', 'Arms' etc.
        excludedExercises: string[],
        includeLegs: boolean,
        userProfile?: { enabled: boolean; availableExercises: string[] }
    ): Exercise[] {
        // AI PROFILE MODE (Primary)
        if (userProfile?.enabled && userProfile.availableExercises.length > 0) {
            let uniqueExercises = allExercises.filter(ex =>
                userProfile.availableExercises.includes(ex.name) &&
                !excludedExercises.includes(ex.name)
            );

            if (category && category !== 'Full Body') {
                uniqueExercises = uniqueExercises.filter(ex => {
                    const mg = ex.muscleGroup.toLowerCase();
                    if (category === 'Arms') {
                        return ['Biceps', 'Triceps', 'Forearms', 'Arms'].map(s => s.toLowerCase()).includes(mg);
                    }
                    if (category === 'Back') {
                        return ['lats', 'middle back', 'lower back', 'traps', 'back'].includes(mg);
                    }
                    if (category === 'Legs') {
                        return ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors', 'legs', 'quads'].includes(mg);
                    }
                    return ex.category === category || ex.muscleGroup === category;
                });
            }
            return uniqueExercises;
        }

        // LEGACY MODE (Fallback if no profile)
        const legacyUserEq = this.normalizeUserEquipment(equipmentString);

        let uniqueExercises = allExercises;

        // Filter by category first
        if (category && category !== 'Full Body') {
            uniqueExercises = uniqueExercises.filter(ex => ex.category === category);
        }

        const filtered = uniqueExercises.filter(ex => {
            // GLOBAL FILTER: Excluded Exercises
            if (excludedExercises.includes(ex.name)) return false;

            // GLOBAL FILTER: Exclude Legs if disabled
            if (!includeLegs) {
                const isLegs = ex.category === 'Legs' ||
                    ['quads', 'hamstrings', 'calves', 'glutes', 'legs', 'adductors', 'abductors'].includes(ex.muscleGroup.toLowerCase());
                if (isLegs) return false;
            }

            // Filter by Category (Split)
            if (category && category !== 'Full Body') {
                if (category === 'Arms') {
                    // Special Case: Arms includes Biceps, Triceps, Forearms
                    const isArm = ['Biceps', 'Triceps', 'Forearms', 'Arms'].includes(ex.muscleGroup);
                    if (!isArm) return false;
                } else if (category === 'Back') {
                    const mg = ex.muscleGroup.toLowerCase();
                    const isBack = ['lats', 'middle back', 'lower back', 'traps', 'back'].includes(mg);
                    if (!isBack && ex.category !== 'Pull') return false;
                    if (!isBack) return false;
                } else if (category === 'Legs') {
                    const mg = ex.muscleGroup.toLowerCase();
                    const isLegs = ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors', 'legs', 'quads'].includes(mg);
                    if (!isLegs) return false;
                } else {
                    if (ex.category !== category && ex.muscleGroup !== category) {
                        return false;
                    }
                }
            }

            // Smart Equipment Check
            const requiredList: string[] = Array.isArray(ex.equipment)
                ? ex.equipment.map(e => e.toLowerCase().trim())
                : (ex.equipment ? [ex.equipment.toLowerCase().trim()] : []);

            if (requiredList.length === 0) return false;

            // Check if ANY of the user's mapped equipment matches ANY required option
            return legacyUserEq.some(u =>
                requiredList.some(req => {
                    if (req.length < 3) return u === req;
                    return req.includes(u) || u.includes(req);
                })
            );
        });

        return filtered;
    }
}
