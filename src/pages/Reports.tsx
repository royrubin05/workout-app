import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { ArrowLeft, Calendar, Dumbbell, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Reports: React.FC = () => {
    const { history } = useWorkout();

    // Sort history by date desc
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {entry.exercises.filter(e => e.completed).length}/{entry.exercises.length}
                                    </div>
                                    <div className="text-xs text-slate-500">Completed</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {entry.exercises.map((ex, i) => (
                                    <div key={i} className={`flex items-center justify-between text-sm p-2 rounded-lg ${ex.completed ? 'bg-slate-800/50 text-slate-300' : 'bg-red-900/10 text-slate-500'}`}>
                                        <span className="flex items-center gap-2">
                                            {ex.completed ? (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                            )}
                                            {ex.name}
                                        </span>
                                        <span className="text-xs opacity-50">{ex.muscleGroup}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
