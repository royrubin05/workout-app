import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Target, Wand2 } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface CustomizeWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MUSCLE_GROUPS = [
    'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio'
];

const EQUIPMENT_OPTIONS = [
    'Bodyweight', 'Dumbbells', 'Barbell', 'Cables', 'Machine', 'Kettlebell', 'Bands'
];

export const CustomizeWorkoutModal: React.FC<CustomizeWorkoutModalProps> = ({ isOpen, onClose }) => {
    const { generateCustomWorkout } = useWorkout();
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleGenerate = () => {
        generateCustomWorkout(selectedTargets, selectedEquipment);
        onClose();
    };

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
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Wand2 size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Customize Workout</h2>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Target Areas */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Target size={16} /> Target Muscles
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {MUSCLE_GROUPS.map(muscle => (
                                        <button
                                            key={muscle}
                                            onClick={() => toggleSelection(muscle, selectedTargets, setSelectedTargets)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTargets.includes(muscle)
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750 border border-slate-700'
                                                }`}
                                        >
                                            {muscle}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Equipment */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Dumbbell size={16} /> Equipment Available
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {EQUIPMENT_OPTIONS.map(eq => (
                                        <button
                                            key={eq}
                                            onClick={() => toggleSelection(eq, selectedEquipment, setSelectedEquipment)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedEquipment.includes(eq)
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750 border border-slate-700'
                                                }`}
                                        >
                                            {eq}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Leave empty to use your default saved equipment.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-700 bg-slate-800/30">
                            <button
                                onClick={handleGenerate}
                                disabled={selectedTargets.length === 0}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                Generate Custom Workout
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
