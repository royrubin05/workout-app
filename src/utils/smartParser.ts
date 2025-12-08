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
const callOpenAI = async (apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> => {
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
    classifyExercise: async (apiKey: string, name: string) => {
        // Try AI First
        const aiResponse = await callOpenAI(
            apiKey,
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
        // ... existing logic ...
        // Keeping this as a potential helper or fallback
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
    },

    /**
     * Filters the ENTIRE exercise list based on the user's equipment profile.
     * Returns a list of exercise names that are performable.
     */
    filterExercisesByProfile: async (apiKey: string, profile: string, allExercises: { name: string, equipment: string | string[] }[]): Promise<string[]> => {
        // 1. Try AI First
        const exerciseList = allExercises.map(e => e.name).join(', ');
        const prompt = `
        User Equipment Profile: "${profile}"
        
        Task: Identify which of the following exercises can be performed with the user's equipment.
        - If the user says "full gym", include everything.
        - If "bodyweight only", includes only bodyweight moves.
        - Be generous: e.g. "Dumbbell Press" can't be done if user only has Bands, but "Pushups" can be done if user has "only a mat".
        
        Exercise List: ${exerciseList}
        
        Return JSON Array of strings containing ONLY the names of the performable exercises. 
        Example: ["Pushups", "Squats"]
        `;

        const aiResponse = await callOpenAI(
            apiKey,
            `You are a strict fitness equipment auditor. Return JSON array of valid exercise names.`,
            prompt
        );

        if (aiResponse) {
            try {
                const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.warn('AI Batch Filter Error, falling back to regex', e);
            }
        }

        // 2. Fallback Regex Logic (Offline)
        console.log('Using Fallback Filter Logic');
        const lowerProfile = profile.toLowerCase();

        // Simple heuristic: what categories does the user have?
        const hasDumbbells = KEYWORDS.dumbbells.some(k => lowerProfile.includes(k));
        const hasBarbell = KEYWORDS.barbell.some(k => lowerProfile.includes(k));
        const hasCables = KEYWORDS.cables.some(k => lowerProfile.includes(k));
        const hasMachine = KEYWORDS.machine.some(k => lowerProfile.includes(k));
        const hasBands = KEYWORDS.bands.some(k => lowerProfile.includes(k));
        const hasKettlebell = KEYWORDS.kettlebell.some(k => lowerProfile.includes(k));

        if (lowerProfile.includes('full gym') || lowerProfile.includes('everything')) {
            return allExercises.map(e => e.name);
        }

        // Filter based on detected equipment flags
        return allExercises.filter(ex => {
            const eq = Array.isArray(ex.equipment)
                ? ex.equipment.map(e => e.toLowerCase()).join(' ')
                : (ex.equipment ? ex.equipment.toLowerCase() : '');

            if (!eq || eq.includes('bodyweight')) return true;
            if (hasDumbbells && eq.includes('dumbbell')) return true;
            if (hasBarbell && eq.includes('barbell')) return true;
            if (hasCables && (eq.includes('cable') || eq.includes('machine'))) return true;
            if (hasMachine && eq.includes('machine')) return true;
            if (hasBands && eq.includes('band')) return true;
            if (hasKettlebell && (eq.includes('kettlebell') || eq.includes('kb'))) return true;
            return false;
        }).map(e => e.name);
    },

    /**
     * Generates a full workout routine using AI.
     */
    generateAIWorkout: async (
        apiKey: string,
        split: string,
        focusArea: string,
        equipmentProfile: string,
        availableExercises: string[],
        favorites: string[] = [] // NEW: Favorites List
    ): Promise<{ strategy: string, exercises: { name: string, sets: string, reps: string, note: string }[] }> => {

        const prompt = `
        Create a perfect ${split} workout focusing on ${focusArea}.
        User Equipment: ${equipmentProfile || "Bodyweight"}
        
        Available Whitelist (Use primarily these): 
        ${availableExercises.slice(0, 100).join(', ')}...
        
        ⭐ FAVORITES (PRIORITIZE THESE IF POSSIBLE): 
        ${favorites.join(', ')}
        
        Rules:
        1. Include 6-8 exercises.
        2. Sequence them logically: Warmup -> Heavy Compound -> Hypertrophy -> Isolation/Finisher.
        3. If a Favorite fits the split/muscle, USE IT and place it prominently.
        4. Return JSON OBJECT: { 
            "strategy": "A 2-sentence specific advice for this specific workout session (e.g. 'Focus on slow eccentrics for chest today as we are doing high volume...')",
            "exercises": [{"name": "Bench Press", "sets": "4", "reps": "5-8", "note": "Explode up"}] 
        }
        `;

        const response = await callOpenAI(apiKey, "You are a world-class program designer. Return ONLY JSON.", prompt);
        if (!response) return { strategy: "Focus on form.", exercises: [] };

        try {
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(jsonStr);
            if (json.exercises && Array.isArray(json.exercises)) {
                return {
                    strategy: json.strategy || "Focus on form.",
                    exercises: json.exercises
                };
            }
            if (Array.isArray(json)) return { strategy: "Focus on form.", exercises: json };
        } catch (e) {
            console.error('AI Parse Error:', e);
        }
        return { strategy: "Focus on form.", exercises: [] };
    },

    /**
     * Creates a NEW Exercise object from a natural language prompt.
     * Guaranteed to return a valid object for the DB.
     */
    createExerciseFromPrompt: async (apiKey: string, prompt: string): Promise<{ name: string, muscleGroup: string, category: string, equipment: string, description: string }> => {
        const query = `
        User wants to create a new exercise: "${prompt}"
        
        Return a JSON object with:
        - name: A clean, standard name (e.g. "Cable Glute Kickback")
        - muscleGroup: Main target (Chest, Back, Legs, Shoulders, Arms, Core)
        - category: Push, Pull, Legs, Core, Full Body
        - equipment: Dumbbell, Barbell, Machine, Cable, Band, Bodyweight, Kettlebell
        - description: A 1-sentence form cue.
        `;

        const response = await callOpenAI(apiKey, "You are a fitness data expert.", query);

        if (response) {
            try {
                const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(jsonStr);
                return {
                    name: parsed.name || prompt,
                    muscleGroup: parsed.muscleGroup || 'Full Body',
                    category: parsed.category || 'Full Body',
                    equipment: parsed.equipment || 'Bodyweight',
                    description: parsed.description || 'Custom Exercise'
                };
            } catch (e) {
                console.error("AI Create Error", e);
            }
        }

        // Fallback
        return {
            name: prompt,
            muscleGroup: 'Full Body',
            category: 'Full Body',
            equipment: 'Bodyweight',
            description: 'Custom Created Exercise'
        };
    }
};
