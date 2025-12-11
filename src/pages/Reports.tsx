import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Reports: React.FC = () => {
    const { history, dailyWorkout, currentSplit, focusArea } = useWorkout();

    // Construct "Today's" entry if there are completed exercises
    const activeWorkoutEntry = React.useMemo(() => {
        const completedExercises = dailyWorkout.filter(e => e.completed);
        if (completedExercises.length === 0) return null;

        return {
            date: new Date().toISOString(),
            split: currentSplit,
            focusArea: focusArea,
            exercises: completedExercises, // Only store completed ones
            isToday: true
        };
    }, [dailyWorkout, currentSplit, focusArea]);

    // Merge and aggregate by date
    const aggregatedHistory = React.useMemo(() => {
        let combined = [...history];

        if (activeWorkoutEntry) {
            combined.push(activeWorkoutEntry);
        }

        // Group by Date String
        const grouped: Record<string, {
            date: string;
            splits: Set<string>;
            focusAreas: Set<string>;
            exercises: any[];
        }> = {};

        combined.forEach(entry => {
            const dateKey = new Date(entry.date).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    date: entry.date, // Keep one valid ISO string for sorting
                    splits: new Set(),
                    focusAreas: new Set(),
                    exercises: []
                };
            }
            grouped[dateKey].splits.add(entry.split);
            if (entry.focusArea && entry.focusArea !== 'Default') {
                grouped[dateKey].focusAreas.add(entry.focusArea);
            }
            // Add ONLY completed exercises (just to be safe, though history should already be filtered)
            // But activeEntry might have uncompleted ones? No, activeEntry filters before returning.
            // Wait, activeEntry definition: const completedExercises = dailyWorkout.filter(e => e.completed);
            // So we are good.
            // Add completed exercises, ensuring uniqueness by NAME for that day
            const newExercises = entry.exercises.filter((e: any) => e.completed);
            newExercises.forEach((newEx: any) => {
                // Check if already in today's group
                if (!grouped[dateKey].exercises.some(existing => existing.name === newEx.name)) {
                    grouped[dateKey].exercises.push(newEx);
                }
            });
        });

        // Convert back to array
        return Object.values(grouped).map(group => ({
            date: group.date,
            split: Array.from(group.splits).join(' & '),
            focusArea: Array.from(group.focusAreas).join(', '),
            exercises: group.exercises
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history, activeWorkoutEntry]);

    return (
        <div className="min-h-screen pb-24">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/settings" className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-white">Workout History</h1>
            </div>

            <div className="space-y-4">
                {aggregatedHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>No workouts logged yet.</p>
                    </div>
                ) : (
                    aggregatedHistory.map((entry, index) => (
                        <div key={index} className="glass-card p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <Calendar size={14} />
                                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <h3 className="text-lg font-bold text-white flex flex-col gap-1">
                                        <span>{entry.split} Day</span>
                                        {entry.focusArea && (
                                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 w-fit">
                                                Focus: {entry.focusArea}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-emerald-400">
                                        {entry.exercises.length}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">COMPLETED</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm text-slate-400">
                                    {entry.exercises.length} Exercises Completed
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {entry.exercises.slice(0, 5).map((ex, j) => (
                                        <span key={j} className="text-[10px] px-2 py-1 bg-slate-700 rounded-full text-slate-300">
                                            {ex.name}
                                        </span>
                                    ))}
                                    {entry.exercises.length > 5 && (
                                        <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                            +{entry.exercises.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
