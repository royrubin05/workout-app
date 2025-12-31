import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface LogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (val: string) => void;
    initialValue: string;
    exerciseName: string;
}

export const LogModal: React.FC<LogModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialValue,
    exerciseName
}) => {
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const weightInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Parse initial value (e.g., "185x5" or "135lbs x 5")
            const match = initialValue.match(/(\d+)(?:lbs?)?\s*x\s*(\d+)/i);
            if (match) {
                setWeight(match[1]);
                setReps(match[2]);
            } else {
                setWeight("");
                setReps(initialValue);
            }

            // Focus weight input after animation
            setTimeout(() => {
                weightInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialValue]);

    const handleSave = (e?: React.FormEvent) => {
        e?.preventDefault();

        let finalString = reps;
        if (weight && weight.trim() !== "") {
            finalString = `${weight}x${reps}`;
        }

        onSave(finalString);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1a1b26] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Log Set</h3>
                                    <p className="text-slate-400 text-sm truncate max-w-[250px]">{exerciseName}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Weight (lbs)</label>
                                        <input
                                            ref={weightInputRef}
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-2xl font-bold text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="0"
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Reps</label>
                                        <input
                                            type="number"
                                            value={reps}
                                            onChange={(e) => setReps(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-2xl font-bold text-white text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            placeholder="0"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    Save Log
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
