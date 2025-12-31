import type { WorkoutHistory } from '../types';

export interface Big4Stats {
    horizontalPush: number; // 1RM
    verticalPush: number;
    verticalPull: number;
    horizontalPull: number;
    lastLogs: {
        horizontalPush: string;
        verticalPush: string;
        verticalPull: string;
        horizontalPull: string;
    };
}

export class ProgressionService {
    /**
     * Epley Formula: 1RM = Weight * (1 + Reps/30)
     */
    static calculate1RM(weight: number, reps: number): number {
        if (reps === 1) return weight;
        return Math.round(weight * (1 + reps / 30));
    }

    /**
     * Parses "185lbs x 5", "200x5", "50kg x 10" etc.
     */
    static parsePerformance(perfString?: string): { weight: number, reps: number } | null {
        if (!perfString) return null;

        // Clean string (remove lbs, kg, spaces)
        const clean = perfString.toLowerCase().replace(/lbs/g, '').replace(/kg/g, '').trim();

        // Try "Weight x Reps" pattern
        const parts = clean.split('x');
        if (parts.length === 2) {
            const w = parseFloat(parts[0]);
            const r = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(r)) return { weight: w, reps: r };
        }

        // Try "Reps @ Weight" pattern ?? Uncommon but possible.
        // For now assume Weight x Reps or just pure number if only reps?
        // If just a number, it's just reps, weight is 0 (bodyweight?)
        const solo = parseFloat(clean);
        if (!isNaN(solo) && !clean.includes('x')) {
            // Assume 0 weight (Bodyweight)
            return { weight: 0, reps: solo };
        }

        return null;
    }

    static getBig4Stats(history: WorkoutHistory[]): Big4Stats {
        const stats: Big4Stats = {
            horizontalPush: 0,
            verticalPush: 0,
            verticalPull: 0,
            horizontalPull: 0,
            lastLogs: {
                horizontalPush: 'N/A',
                verticalPush: 'N/A',
                verticalPull: 'N/A',
                horizontalPull: 'N/A'
            }
        };

        // Filter last 30 days? Or all history? 
        // User asked for "Last 14 days" for Bench, but "Tracks..." generally.
        // Let's use all history but prioritize recent? Or just max ever?
        // "Horizontal Push: Tracks your best Bench Press... from the last 14 days."

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90); // Look back 90 days for general stats to be safe? 
        // App logic says 14 days for Bench. Let's do 30 days for robust recent stats.

        history.forEach(session => {
            // const date = new Date(session.date); // Unused
            // if (date < cutoff) return; // Optional date filter

            session.exercises.forEach(ex => {
                if (!ex.reps || !ex.completed) return;

                const parsed = this.parsePerformance(ex.reps);
                if (!parsed || parsed.weight === 0) return; // Skip bodyweight only for 1RM charts for now? 
                // Or handle bodyweight as 0? 1RM of 0 is bad. 
                // Maybe "Bodyweight x 12" -> Weight = User Weight? We don't know it.
                // If weight is 0, we can't estimate 1RM meaningfully relative to weighted lifts.

                const oneRM = this.calculate1RM(parsed.weight, parsed.reps);
                const name = ex.name.toLowerCase();

                // Categorize
                // Horizontal Push: Bench Press (Flat, Incline, Decline, Dumbbell, Machine)
                // Exclude: Flys, Pushups (unless loaded)
                if (
                    (name.includes('bench press') || name.includes('chest press') || name.includes('floor press')) &&
                    !name.includes('close grip') // Usually triceps
                ) {
                    if (oneRM > stats.horizontalPush) {
                        stats.horizontalPush = oneRM;
                        stats.lastLogs.horizontalPush = `${parsed.weight}x${parsed.reps}`;
                    }
                }

                // Vertical Push: Overhead, Military, Shoulder Press, Arnold
                else if (
                    name.includes('overhead press') ||
                    name.includes('military press') ||
                    name.includes('shoulder press') ||
                    name.includes('arnold press')
                ) {
                    if (oneRM > stats.verticalPush) {
                        stats.verticalPush = oneRM;
                        stats.lastLogs.verticalPush = `${parsed.weight}x${parsed.reps}`;
                    }
                }

                // Vertical Pull: Pull-up, Chin-up, Lat Pulldown
                else if (
                    name.includes('pull-up') ||
                    name.includes('chin-up') ||
                    name.includes('lat pulldown')
                ) {
                    if (oneRM > stats.verticalPull) {
                        stats.verticalPull = oneRM;
                        stats.lastLogs.verticalPull = `${parsed.weight}x${parsed.reps}`;
                    }
                }

                // Horizontal Pull: Row (Barbell, Dumbbell, Cable, Machine)
                else if (
                    name.includes('row') &&
                    !name.includes('upright') // Shoulder
                ) {
                    if (oneRM > stats.horizontalPull) {
                        stats.horizontalPull = oneRM;
                        stats.lastLogs.horizontalPull = `${parsed.weight}x${parsed.reps}`;
                    }
                }
            });
        });

        return stats;
    }
}
