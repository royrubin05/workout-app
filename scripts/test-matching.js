
const EXERCISES = [
    { name: 'Dumbbell Press', equipment: 'Dumbbell' },
    { name: 'Cable Crossover', equipment: 'Cable' },
    { name: 'Push Up', equipment: 'Body Weight' },
    { name: 'Smith Machine Press', equipment: 'Smith Machine' },
    { name: 'Barbell Squat', equipment: 'Barbell' }
];

const state = {
    includeBodyweight: false
};

const normalizeUserEquipment = (userInput) => {
    const rawItems = userInput.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    const mappedItems = new Set();

    // Always include bodyweight IF enabled
    if (state.includeBodyweight) {
        mappedItems.add('body weight');
        mappedItems.add('body only');
        mappedItems.add('bodyweight');
    }

    rawItems.forEach(item => {
        // Direct match (cleaned)
        mappedItems.add(item);
        mappedItems.add(item.replace(/\s+/g, '')); // Add "kettlebells" from "kettle bells"

        // Synonyms & Inferences
        if (item.includes('dumb') || item.includes('weight')) {
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
    });

    return Array.from(mappedItems);
};

const getAvailableExercises = (eqString) => {
    const userEq = normalizeUserEquipment(eqString);
    console.log('User Equipment:', userEq);

    return EXERCISES.filter(ex => {
        const requiredEq = ex.equipment?.toLowerCase().trim();
        if (!requiredEq) return false;

        return userEq.some(u => {
            if (requiredEq.length < 3) return u === requiredEq;
            return requiredEq.includes(u) || u.includes(requiredEq);
        });
    });
};

// Test Case
console.log("--- Testing 'cable machine' (Bodyweight OFF) ---");
state.includeBodyweight = false;
const results = getAvailableExercises("cable machine");
console.log("Results:", results.map(r => r.name));

console.log("\n--- Testing 'cable machine' (Bodyweight ON) ---");
state.includeBodyweight = true;
const resultsBW = getAvailableExercises("cable machine");
console.log("Results:", resultsBW.map(r => r.name));
