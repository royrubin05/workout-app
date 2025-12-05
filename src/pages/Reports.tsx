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

    // Merge and sort
    const sortedHistory = React.useMemo(() => {
        let combined = [...history];

        if (activeWorkoutEntry) {
            // ALWAYS prioritize the active/live workout for today over any stored history
            const todayStr = new Date().toDateString();
            combined = combined.filter(h => new Date(h.date).toDateString() !== todayStr);
            combined.push(activeWorkoutEntry);
        }

        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
                {sortedHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>No workouts logged yet.</p>
                    </div>
                ) : (
                    sortedHistory.map((entry, index) => (
                        <div key={index} className="glass-card p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <Calendar size={14} />
                                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {entry.split} Day
                                        {entry.focusArea && entry.focusArea !== 'Default' && (
                                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                                Focus: {entry.focusArea}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-emerald-400">
                                        {entry.exercises.filter(e => e.completed).length}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">COMPLETED</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm text-slate-400">
                                    {entry.exercises.filter(e => e.completed).length} Exercises Completed
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {entry.exercises.filter(e => e.completed).slice(0, 3).map((ex, j) => (
                                        <span key={j} className="text-[10px] px-2 py-1 bg-slate-700 rounded-full text-slate-300">
                                            {ex.name}
                                        </span>
                                    ))}
                                    {entry.exercises.filter(e => e.completed).length > 3 && (
                                        <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                            +{entry.exercises.filter(e => e.completed).length - 3} more
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
