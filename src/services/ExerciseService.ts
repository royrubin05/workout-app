import { supabase } from './supabase';
import { BASE_MOVEMENTS } from '../data/exercises';
import type { Exercise } from '../data/exercises';

export class ExerciseService {
    static async getAllExercises(): Promise<Exercise[]> {
        try {
            // 1. Fetch from Supabase
            const { data, error } = await supabase.from('exercises').select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                return data.map(d => ({
                    name: d.name,
                    category: d.category,
                    muscles: d.muscle_group,
                    muscleGroup: d.muscle_group, // Map DB 'muscle_group' -> App 'muscleGroup'
                    equipment: d.equipment,
                    type: 'Compound', // Default, logic could be refined
                    gifUrl: d.gif_url,
                    id: d.id || `db-${Math.random()}`
                }));
            }

            throw new Error('No data in DB');
        } catch (err) {
            console.warn('Offline or DB Error, using static data:', err);
            // Fallback to static data
            return BASE_MOVEMENTS.map((ex: any, i: number) => ({
                id: `static-${i}`,
                name: ex.name,
                category: ex.category,
                muscleGroup: ex.muscles,
                equipment: ex.equipment,
                type: 'Compound',
                muscles: ex.muscles,
                gifUrl: ex.gif_url
            }));
        }
    }
}
