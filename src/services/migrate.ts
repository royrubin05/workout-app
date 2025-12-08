import { supabase } from './supabase';
import { BASE_MOVEMENTS } from '../data/exercises';

export const migrateExercises = async () => {
    console.log('Starting Migration...');

    // 1. Check if table is empty
    const { count, error } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Migration Check Failed:', error);
        return { success: false, message: 'Connection Error' };
    }

    if (count && count > 0) {
        console.log('Data already exists. Skipping migration.');
        return { success: true, message: 'Already migrated' };
    }

    // 2. Insert Data
    console.log(`Inserting ${BASE_MOVEMENTS.length} exercises...`);

    // We need to flatten equipment array to string for display or use array column?
    // Let's assume schema has `equipment` as text[] or jsonb.
    // If table doesn't exist, this fails. We assume table exists.

    const { error: insertError } = await supabase
        .from('exercises')
        .insert(BASE_MOVEMENTS.map(ex => ({
            name: ex.name,
            category: ex.category,
            muscle_group: ex.muscles, // Mapping 'muscles' -> 'muscle_group'
            equipment: ex.equipment, // Array
            // generate UUID? Supabase does it automatically if omitted?
        })));

    if (insertError) {
        console.error('Migration Insert Failed:', insertError);
        return { success: false, message: insertError.message };
    }

    console.log('Migration Complete!');
    return { success: true, message: 'Success' };
};
