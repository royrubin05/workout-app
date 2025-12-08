import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, X } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import type { WorkoutExercise } from '../context/WorkoutContext';

interface UpcomingWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpcomingWorkoutModal: React.FC<UpcomingWorkoutModalProps> = ({ isOpen, onClose }) => {
    const { currentSplit, getAvailableExercises, equipment } = useWorkout();
    const [previewWorkout, setPreviewWorkout] = useState<WorkoutExercise[]>([]);
    const [nextSplit, setNextSplit] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Determine "Next" split logic
            const splits = ['Push', 'Pull', 'Legs'];
            const currentIndex = splits.indexOf(currentSplit);
            const nextIndex = (currentIndex + 1) % splits.length;
            const next = splits[nextIndex];
            setNextSplit(next);

            // Generate a Preview (Simplified Logic)
            // We just grabbing 5-6 exercises for that split to show a sample
            // Using standard "Default" focus unless user has specific overrides active (but usually next day resets?)
            // Let's assume standard rotation for preview.

            const candidates = getAvailableExercises(equipment, next);
            // Group by muscle matching standard split slots
            const selected: WorkoutExercise[] = [];

            // Simple diverse selection for preview
            const shuffled = candidates.sort(() => 0.5 - Math.random());

            // Pick ~6 exercises
            // Ensure variety (unique muscles)
            const usedMuscles = new Set<string>();
            shuffled.forEach(ex => {
                if (selected.length < 6 && !usedMuscles.has(ex.muscleGroup)) {
                    selected.push(ex);
                    usedMuscles.add(ex.muscleGroup);
                }
            });

            // Fill if short
            if (selected.length < 6) {
                shuffled.forEach(ex => {
                    if (selected.length < 6 && !selected.includes(ex)) selected.push(ex);
                });
            }

            setPreviewWorkout(selected);
        }
    }, [isOpen, currentSplit, equipment]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <CalendarDays size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Tomorrow's Plan</h2>
                                    <div className="flex items-center gap-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        Next Up: <span className="text-purple-400">{nextSplit}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-3">
                                {previewWorkout.map((ex, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-700">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="text-slate-200 font-bold text-sm">{ex.name}</div>
                                            <div className="text-xs text-slate-500">{ex.muscleGroup} • {ex.equipment}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                                <p className="text-purple-300 text-xs leading-relaxed">
                                    This is a preview based on your current settings.
                                    Specific exercises might vary slightly when you actually log in tomorrow!
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
