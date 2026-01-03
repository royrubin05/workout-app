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
    barbell: ['barbell', 'bar', 'bb', 'bench press station'], // "bar" covers "bar bell" because it checks includes
    cables: ['cable', 'pulley', 'machine', 'tower'],
    bodyweight: ['body', 'calisthenic', 'no equipment', 'floor', 'mat'],
    machine: ['machine', 'hammer strength', 'smith'],
    kettlebell: ['kettlebell', 'kb'],
    bands: ['band', 'elastic', 'resistance']
};

/**
 * Helper to call OpenAI API
 */
const callOpenAI = async (apiKey: string, systemPrompt: string, userPrompt: string): Promise<{ content: string | null, error?: string }> => {
    if (!apiKey) {
        console.warn("SmartParser: No API Key provided to callOpenAI");
        return { content: null, error: "Missing API Key" };
    }

    if (!apiKey.startsWith("sk-")) {
        return { content: null, error: "Invalid API Key format (must start with 'sk-')" };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        console.log("SmartParser: Calling OpenAI with key length:", apiKey.length);
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
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
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errText = await res.text();
            console.error('OpenAI API Error Status:', res.status, errText);

            let cleanError = `API Error ${res.status}`;
            try {
                const jsonErr = JSON.parse(errText);
                if (jsonErr.error?.message) cleanError += `: ${jsonErr.error.message}`;
            } catch (e) {
                cleanError += `: ${errText.substring(0, 100)}`;
            }
            return { content: null, error: cleanError };
        }

        const data = await res.json();
        return { content: data.choices?.[0]?.message?.content || null };
    } catch (e: any) {
        clearTimeout(timeoutId);
        console.error('OpenAI Network/Fetch Failed or Timed Out:', e);
        return { content: null, error: `Network/Timeout: ${e.message || e}` };
    }
};

export const SmartParser = {
    /**
     * Guesses the properties of an exercise based on its name.
     */
    classifyExercise: async (apiKey: string, name: string) => {
        // Try AI First
        const { content: aiResponseContent } = await callOpenAI(
            apiKey,
            `You are a fitness expert. Classify the exercise provided into JSON format: { "muscleGroup": "Chest"|"Back"|"Legs"|"Shoulders"|"Biceps"|"Triceps"|"Abs"|"Full Body", "category": "Push"|"Pull"|"Legs"|"Core"|"Full Body", "equipment": "Barbell"|"Dumbbells"|"Bodyweight"|"Machine"|"Cables"|"Bands"|"Kettlebell" }. Only return JSON.`,
            `Exercise: ${name}`
        );

        if (aiResponseContent) {
            try {
                // Cleanup JSON formatting if md code block is returned
                const jsonStr = aiResponseContent.replace(/```json/g, '').replace(/```/g, '').trim();
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

        const { content: aiResponseContent, error: aiError } = await callOpenAI(
            apiKey,
            `You are a strict fitness equipment auditor. Return JSON array of valid exercise names.`,
            prompt
        );

        if (aiResponseContent) {
            try {
                // Heuristic: If response is just a list, clean it heavily
                const clean = aiResponseContent
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .replace(/^\s*\[/, '[')
                    .replace(/\]\s*$/, ']')
                    .trim();

                const parsed = JSON.parse(clean);
                if (Array.isArray(parsed)) return parsed.map(s => typeof s === 'string' ? s : '').filter(Boolean);
            } catch (e) {
                console.warn('AI Batch Filter Parsing Error:', e, aiResponseContent.substring(0, 100));
            }
        } else if (aiError) {
            console.warn('AI Batch Filter API Error:', aiError);
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
        4. STRICT FOCUS RULE: If '${focusArea}' is NOT 'Default', every exercise MUST target '${focusArea}'. Do NOT include secondary muscles (e.g. if Focus is Chest, do NOT add Triceps). If '${focusArea}' is 'Arms', respect the Split (Push=Triceps, Pull=Biceps).
            "strategy": "Direct, actionable coaching advice. Start with a verb. Do not say 'This workout...'. Example: 'Focus on slow tempor for your presses today.'",
            "exercises": [{"name": "Bench Press", "sets": "4", "reps": "5-8", "note": "Explode up"}]
        }
        `;

        const { content: responseContent, error: responseError } = await callOpenAI(apiKey, "You are a world-class program designer. Return ONLY JSON.", prompt);
        if (!responseContent) return { strategy: `Workout generation failed: ${responseError || "Unknown error"}`, exercises: [] };

        try {
            const jsonStr = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
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
     * Refines an EXISTING workout based on custom user instructions (e.g. "I have a shoulder injury").
     */
    generateRefinedWorkout: async (
        apiKey: string,
        currentWorkout: { name: string, sets: string, reps: string, note?: string }[],
        userInstructions: string,
        availableExercises: string[],
        equipmentProfile: string,
        favorites: string[] = []
    ): Promise<{ strategy: string, exercises: { name: string, sets: string, reps: string, note: string }[] }> => {

        const currentList = currentWorkout.map(e => `- ${e.name} (${e.sets}x${e.reps})`).join('\n');

        const prompt = `
        ACT AS AN ELITE FITNESS COACH.
        
        YOUR GOAL: Modify the "Current Plan" below to STRICTLY ADHERE to the "USER INSTRUCTIONS".
        
        Current Plan:
        ${currentList}

        User Equipment: ${equipmentProfile || "Bodyweight"}
        
        CRITICAL INSTRUCTIONS: "${userInstructions}"

        Available Whitelist (Use these exercises if you need to swap/replace): 
        ${availableExercises.slice(0, 150).join(', ')}...
        
        Favorites (Prioritize these if they fit): ${favorites.join(', ')}

        EXECUTION RULES:
        1. IF the user asks to "remove" or "avoid" something, YOU MUST REMOVE IT. Do not keep it.
        2. IF the user asks to "focus" on something, REPLACE non-essential exercises with relevant ones from the whitelist.
        3. YOU HAVE PERMISSION TO COMPLETELY REWRITE THE EXERCISE LIST if necessary to meet the User Instructions.
        4. Strategy: Explain exactly what you changed and why, referencing the user's specific request.

        Return JSON OBJECT: {
            "strategy": "Concise explanation of changes. Start with 'Adjusted plan to...'",
            "exercises": [{"name": "Exercise Name", "sets": "4", "reps": "8-12", "note": "Technique note"}]
        }
        `;

        console.log("Sending Refinement Prompt to OpenAI...");
        const { content: responseContent, error: responseError } = await callOpenAI(apiKey, "You are a strict fitness coach. You MUST modify the workout to match instructions.", prompt);
        console.log("OpenAI Response:", responseContent);

        if (!responseContent) {
            return { strategy: `Refinement Failed: ${responseError || "Unknown Error"}`, exercises: [] };
        }

        try {
            const jsonStr = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(jsonStr);
            if (json.exercises && Array.isArray(json.exercises)) {
                return {
                    strategy: json.strategy || "Workout refined.",
                    exercises: json.exercises
                };
            }
            if (Array.isArray(json)) return { strategy: "Workout refined.", exercises: json };
        } catch (e) {
            console.error('AI Refine Parse Error:', e);
        }
        return { strategy: "Could not refine workout.", exercises: [] };
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

        const { content: responseContent } = await callOpenAI(apiKey, "You are a fitness data expert.", query);

        if (responseContent) {
            try {
                const jsonStr = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
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

        // Fallback: Smart Regex Guess
        const guess = await SmartParser.classifyExercise("", prompt); // Passing empty key triggers fallback logic in classifyExercise

        return {
            name: prompt,
            muscleGroup: guess.muscleGroup,
            category: guess.category,
            equipment: guess.equipment,
            description: 'Custom Created Exercise'
        };
    },

    /**
     * Generates an Advanced Cycle Workout enforcing progressive overload (Big 4).
     */
    generateAdvancedCycle: async (
        apiKey: string,
        equipmentList: string,
        lastWorkoutType: string,
        daysAgo: number,
        stats: { bench: string, incline: string, pullups: string, row: string }
    ): Promise<{
        success: boolean,
        workout?: {
            meta: { workout_type: string, focus_summary: string },
            exercises: { order: number, name: string, type: string, sets: number, reps: string, last_performance: string, target_goal: string, rest_seconds: number }[]
        }
    }> => {
        const systemPrompt = `You are the "Workout Engine" for an advanced fitness app. 
Your User Profile: Intermediate/Advanced lifter. 
Schedule: 4-5 days/week. 
Constraint: UPPER BODY ONLY (User opts out of leg training). 
Goal: Progressive Overload (Strength & Hypertrophy), NOT random variety.

YOUR LOGIC (THE 4-DAY ROTATION):
Do not randomize the split. Cycle strictly through this order:
1. PUSH A (Strength Focus):
   - Primary: Heavy Flat Press (Barbell/DB)
   - Type 2: Heavy Overhead Press
   - Accessory: Incline Variation
   - Accessory: Triceps Compound (Close grip/Dips)
   - Isolation: Triceps Isolation
   - Isolation: Side Delts
   - Finisher: Chest Fly or Pushups

2. PULL A (Width Focus):
   - Primary: Weighted Pull-ups/Lat Pulldown
   - Type 2: Heavy Row (Barbell/DB)
   - Accessory: Vertical Pull Variation (Different grip)
   - Accessory: Rear Delts (Face Pulls)
   - Isolation: Biceps (Barbell/DB Curl)
   - Isolation: Hammer Curls
   - Stabilization: Shrugs or Scapular work

3. PUSH B (Hypertrophy Focus):
   - Primary: Incline Dumbbell/Machine Press
   - Type 2: Flat DB Press or Weighted Dips
   - Accessory: Overhead Press Variation (Volume)
   - Accessory: Triceps Overhead Extension
   - Isolation: Triceps Pushdown
   - Isolation: Lateral Raises (High Volume)
   - Finisher: Pec Fly

4. PULL B (Thickness/Rear Delt Focus):
   - Primary: T-Bar or Cable Row
   - Type 2: Chin-ups (Volume focus)
   - Accessory: Chest Supported Row
   - Accessory: Face Pulls or Reverse Fly
   - Isolation: Preacher/Incline Curls
   - Isolation: Cable Curls
   - Core: Hanging Leg Raise or Weighted Crunch

*If a 5th day is requested: Generate an "ARMS & WEAK POINTS" day (Pure Isolation).*

HOW TO GENERATE THE WORKOUT:
1. Check \`last_workout_type\`. If previous was "Push A", today is "Pull A".
2. Check \`equipment_list\`. Only pick valid exercises.
3. PROGRESSIVE OVERLOAD (CRITICAL):
   - Look at \`last_stats\` for the main compound lift.
   - Set the \`target_weight\` to be +2.5% to +5% heavier OR +1 rep higher than last time.
   - Do NOT change the Main Compound exercise randomly. Keep it consistent for at least 4 weeks.

OUTPUT FORMAT:
Return ONLY valid JSON with no markdown formatting.
{
  "meta": {
    "workout_type": "PUSH A | PULL A | PUSH B | PULL B",
    "focus_summary": "Short strategy sentence (e.g. 'Heavy triples on bench today')."
  },
  "exercises": [
    {
      "order": 1,
      "name": "Barbell Bench Press",
      "type": "Compound",
      "sets": 4,
      "reps": "5",
      "last_performance": "185lbs x 5", 
      "target_goal": "Try 190lbs x 5 or 185lbs x 6",
      "rest_seconds": 180
    },
    ... (Total of 7-8 exercises)
  ]
}`;

        const userPrompt = `Current Equipment: ${equipmentList}
Last Workout Logged: "${lastWorkoutType}" (Completed ${daysAgo} days ago).
Recent Stats (Big 4):
- Flat Bench: ${stats.bench}
- Incline DB Press: ${stats.incline}
- Pullups: ${stats.pullups}
- DB Row: ${stats.row}

Task: Generate today's workout.`;

        const { content: responseContent, error: responseError } = await callOpenAI(apiKey, systemPrompt, userPrompt);

        if (!responseContent) {
            console.warn("SmartParser: AI response failed for Advanced Cycle.", responseError);
            return { success: false };
        }

        try {
            const jsonStr = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            return { success: true, workout: parsed };
        } catch (e) {
            console.error('AI Advanced Parse Error:', e);
            return { success: false };
        }
    }
};
