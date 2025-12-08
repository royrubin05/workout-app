/**
 * Smart Parser Utility
 * Hybrid: Uses OpenAI if API Key exists, otherwise falls back to Regex Simulation.
 */

// Heuristic Knowledge Base (Fallback)
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

/**
 * Helper to call OpenAI API
 */
const callOpenAI = async (systemPrompt: string, userPrompt: string): Promise<string | null> => {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) return null;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3
            })
        });

        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('OpenAI Call Failed:', e);
        return null; // Fallback to regex
    }
};

export const SmartParser = {
    /**
     * Guesses the properties of an exercise based on its name.
     */
    classifyExercise: async (name: string) => {
        // Try AI First
        const aiResponse = await callOpenAI(
            `You are a fitness expert. Classify the exercise provided into JSON format: { "muscleGroup": "Chest"|"Back"|"Legs"|"Shoulders"|"Biceps"|"Triceps"|"Abs"|"Full Body", "category": "Push"|"Pull"|"Legs"|"Core"|"Full Body", "equipment": "Barbell"|"Dumbbells"|"Bodyweight"|"Machine"|"Cables"|"Bands"|"Kettlebell" }. Only return JSON.`,
            `Exercise: ${name}`
        );

        if (aiResponse) {
            try {
                // Cleanup JSON formatting if md code block is returned
                const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(jsonStr);
                return {
                    muscleGroup: parsed.muscleGroup || 'Full Body',
                    category: parsed.category || 'Full Body',
                    equipment: parsed.equipment || 'Bodyweight' // AI guess or default
                };
            } catch (e) {
                console.warn('AI Parse Error, falling back to regex', e);
            }
        }

        // --- FALLBACK REGEX LOGIC ---
        const lower = name.toLowerCase();

        let muscleGroup = 'Full Body';
        let category: any = 'Full Body';
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

        // 2. Detect Category
        if (['Chest', 'Shoulders', 'Triceps'].includes(muscleGroup)) category = 'Push';
        else if (['Back', 'Biceps'].includes(muscleGroup)) category = 'Pull';
        else if (muscleGroup === 'Legs') category = 'Legs';
        else if (muscleGroup === 'Abs') category = 'Core';

        // 3. Detect Equipment
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
    parseEquipmentPrompt: async (text: string): Promise<string[]> => {
        // Try AI First
        const aiResponse = await callOpenAI(
            `You are a gym equipment scanner. Read the user's description and return a JSON array of detected equipment from this specific list ONLY: ["Barbell", "Dumbbells", "Kettlebell", "Machine", "Cables", "Bands", "Bodyweight"]. If they imply having a full gym, include relevant items. If empty/none, return ["Bodyweight"]. Example output: ["Dumbbells", "Bands"]`,
            `User Setup: ${text}`
        );

        if (aiResponse) {
            try {
                const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.warn('AI Equipment Parse Error, falling back to regex', e);
            }
        }

        // --- FALLBACK REGEX LOGIC ---
        const lower = text.toLowerCase();
        const detected: string[] = [];

        if (KEYWORDS.dumbbells.some(k => lower.includes(k))) detected.push('Dumbbells');
        if (KEYWORDS.barbell.some(k => lower.includes(k))) detected.push('Barbell');
        if (KEYWORDS.cables.some(k => lower.includes(k))) detected.push('Cables');
        if (KEYWORDS.machine.some(k => lower.includes(k))) detected.push('Machine');
        if (KEYWORDS.kettlebell.some(k => lower.includes(k))) detected.push('Kettlebell');
        if (KEYWORDS.bands.some(k => lower.includes(k))) detected.push('Bands');

        if (detected.length === 0 || lower.includes('body') || lower.includes('nothing') || lower.includes('none')) {
            detected.push('Bodyweight');
        }

        return Array.from(new Set(detected));
    }
};
