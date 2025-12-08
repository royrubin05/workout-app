import { supabase } from './supabase';
import { BASE_MOVEMENTS } from '../data/exercises';
import { fetchExercisesFromAPI, mapApiToInternal } from './exerciseDB';

export const migrateExercises = async (force: boolean = false) => {
    console.log(`Starting Migration (Force: ${force})...`);

    // 1. Check if table is empty
    const { count, error } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Migration Check Failed:', error);
        return { success: false, message: 'Connection Error' };
    }

    if (!force && count && count > 0) {
        console.log('Data already exists. Skipping migration.');
        return { success: true, message: 'Already migrated' };
    }

    if (force) {
        console.log('Force migration: clearing existing data...');
        const { error: deleteError } = await supabase.from('exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (assuming UUIDs)
        if (deleteError) console.warn('Clear table failed (ignoring):', deleteError);
    }

    // 2. Prepare Data (Prefer API -> Fallback to Static)
    let exercisesToInsert: any[] = [];

    try {
        console.log('Fetching fresh data from API...');
        const apiData = await fetchExercisesFromAPI();
        if (apiData.length > 0) {
            const mapped = mapApiToInternal(apiData);
            exercisesToInsert = mapped.map(ex => ({
                id: ex.id, // REQUIRED: DB expects non-null ID
                name: ex.name,
                category: ex.category,
                muscle_group: ex.muscleGroup,
                equipment: ex.equipment,
                gif_url: ex.gifUrl
            }));
            console.log(`Using ${exercisesToInsert.length} API exercises (with GIFs).`);
        }
    } catch (e) {
        console.warn('API Fetch failed, using static data.', e);
    }

    if (exercisesToInsert.length === 0) {
        console.log('Using Static Fallback Data (No GIFs).');
        exercisesToInsert = BASE_MOVEMENTS.map((ex, i) => ({
            id: `static-${Date.now()}-${i}`, // Generate ID
            name: ex.name,
            category: ex.category,
            muscle_group: ex.muscles,
            equipment: Array.isArray(ex.equipment) ? ex.equipment.join(',') : ex.equipment,
        }));
    }

    // 3. Insert in Chunks (Supabase limit safety)
    const chunkSize = 100;
    for (let i = 0; i < exercisesToInsert.length; i += chunkSize) {
        const chunk = exercisesToInsert.slice(i, i + chunkSize);
        const { error: insertError } = await supabase.from('exercises').insert(chunk);

        if (insertError) {
            console.error('Migration Chunk Failed:', insertError);
            return { success: false, message: `Insert Failed: ${insertError.message}` };
        }
    }

    console.log('Migration Complete!');
    return { success: true, message: 'Success' };
};
