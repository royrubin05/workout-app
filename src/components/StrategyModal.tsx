import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Target, BrainCircuit } from 'lucide-react';

interface StrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    strategy: string;
    focusArea: string;
}

export const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, strategy, focusArea }) => {
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-all"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-50"
                    >
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">

                            {/* Header */}
                            <div className="relative p-6 border-b border-slate-700/50">
                                <div className="absolute top-0 right-0 p-4">
                                    <button
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <BrainCircuit className="text-blue-400" size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Workout Strategy</h2>
                                </div>
                                <p className="text-slate-400 text-sm pl-1">
                                    AI-generated breakdown of today's session.
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">

                                {/* Focus Area */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <Target size={14} />
                                        <span>Primary Focus</span>
                                    </div>
                                    <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-slate-200 font-medium">
                                        {focusArea || "General Fitness"}
                                    </div>
                                </div>

                                {/* Strategy Insight */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                                        <Sparkles size={14} />
                                        <span>Coach's Rationale</span>
                                    </div>
                                    <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 text-slate-300 leading-relaxed text-sm">
                                        {strategy ? strategy : "No custom strategy generated. Using standard progression logic."}
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-950/30 border-t border-slate-800/50 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-all border border-slate-700 hover:border-slate-600"
                                >
                                    Close
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
