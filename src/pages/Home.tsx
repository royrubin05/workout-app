import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Home: React.FC = () => {
    const { dailyWorkout, completedToday, completeWorkout, refreshWorkout, currentSplit } = useWorkout();

    if (completedToday) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center mt-10"
            >
                <CheckCircle2 size={80} className="text-emerald-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
                <p className="text-slate-400">Great job today. Come back tomorrow for a new routine.</p>
            </motion.div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-1">
                        Today's Focus: <span className="text-white font-bold">{currentSplit}</span>
                    </h2>
                    <h3 className="text-2xl font-bold text-white">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                </div>
                <button
                    onClick={refreshWorkout}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                    title="Regenerate Workout"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="space-y-4 mb-8">
                <AnimatePresence>
                    {dailyWorkout.map((exercise, index) => (
                        <motion.div
                            key={exercise.id + index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-4 flex items-center gap-4"
                        >
                            <div className="w-24 h-24 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden border border-slate-700">
                                {exercise.gifUrl ? (
                                    <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">{index + 1}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg text-white mb-1 truncate">{exercise.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium">
                                        {exercise.equipment}
                                    </span>
                                    <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-medium">
                                        {exercise.muscleGroup}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {dailyWorkout.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <p>No exercises found for your equipment.</p>
                        <p className="text-sm mt-2">Update your settings to add equipment.</p>
                    </div>
                )}
            </div>

            {dailyWorkout.length > 0 && (
                <button onClick={completeWorkout} className="btn-primary">
                    Complete Workout
                </button>
            )}
        </div>
    );
};
