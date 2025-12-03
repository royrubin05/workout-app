import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { RefreshCw, MinusCircle, CheckCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const Home: React.FC = () => {
    const { dailyWorkout, refreshWorkout, currentSplit, excludeExercise, completeWorkout, completedToday, replaceExercise } = useWorkout();
    const [showSuccessToast, setShowSuccessToast] = React.useState(false);

    const handleComplete = () => {
        completeWorkout();
        setShowSuccessToast(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    return (
        <div className="relative">
            {/* Success Toast */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-6 left-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium whitespace-nowrap"
                    >
                        <CheckCircle2 size={20} />
                        Workout Logged Successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-1">
                        Today's Focus: <span className="text-white font-bold">{currentSplit}</span>
                        <span className="text-slate-400 text-xs ml-2 normal-case tracking-normal">
                            {currentSplit === 'Push' && '(Chest, Shoulders, Triceps)'}
                            {currentSplit === 'Pull' && '(Back, Biceps, Rear Delts)'}
                            {currentSplit === 'Legs' && '(Quads, Hamstrings, Calves)'}
                            {currentSplit === 'Full Body' && '(Total Body)'}
                        </span>
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

            <div className="space-y-4 pb-24">
                <AnimatePresence>
                    {dailyWorkout.map((exercise, index) => (
                        <motion.div
                            key={`${exercise.name}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-4 flex items-center gap-4"
                        >
                            <div className="w-16 h-16 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xl overflow-hidden border border-slate-700">
                                {exercise.gifUrl ? (
                                    <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{index + 1}</span>
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

                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => replaceExercise(exercise.name)}
                                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                                    title="Swap Exercise"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button
                                    onClick={() => excludeExercise(exercise.name)}
                                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                    title="Exclude Exercise"
                                >
                                    <MinusCircle size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {dailyWorkout.length > 0 && (
                    <button
                        onClick={handleComplete}
                        disabled={completedToday}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-8 ${completedToday
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                            : 'bg-green-500 hover:bg-green-600 text-white active:scale-95 shadow-green-500/20'
                            }`}
                    >
                        {completedToday ? (
                            <>
                                <CheckCircle2 size={24} />
                                Workout Completed
                            </>
                        ) : (
                            <>
                                <CheckCircle size={24} />
                                Complete Workout
                            </>
                        )}
                    </button>
                )}

                {dailyWorkout.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <p>No exercises found for your equipment.</p>
                        <p className="text-sm mt-2">Update your settings to add equipment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
