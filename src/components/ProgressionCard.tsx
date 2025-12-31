import React, { useState } from 'react';
import type { Big4Stats } from '../services/ProgressionService';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressionCardProps {
    stats: Big4Stats;
}

export const ProgressionCard: React.FC<ProgressionCardProps> = ({ stats }) => {
    // Default to collapsed for mobile-first/cleaner look
    const [isOpen, setIsOpen] = useState(false);

    // Determine max value for bar scaling (simple normalization)
    const maxVal = Math.max(stats.horizontalPush, stats.verticalPush, stats.verticalPull, stats.horizontalPull, 100);

    const items = [
        { label: 'Bench Press', val: stats.horizontalPush, log: stats.lastLogs.horizontalPush, color: 'bg-blue-500' },
        { label: 'Overhead Press', val: stats.verticalPush, log: stats.lastLogs.verticalPush, color: 'bg-emerald-500' },
        { label: 'Weighted Pull-up', val: stats.verticalPull, log: stats.lastLogs.verticalPull, color: 'bg-amber-500' },
        { label: 'Heavy Row', val: stats.horizontalPull, log: stats.lastLogs.horizontalPull, color: 'bg-purple-500' },
    ];

    return (
        <div className="glass-card rounded-2xl border border-white/10 relative overflow-hidden bg-white/5 transition-all">
            {/* Header / Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-4 cursor-pointer active:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Strength Progression</h3>
                </div>

                <div className="flex items-center gap-2">
                    {!isOpen && (
                        <span className="text-xs text-slate-400 font-medium mr-1">
                            {stats.horizontalPush > 0 ? `${stats.horizontalPush}lb Max` : 'Tap to View'}
                        </span>
                    )}
                    {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
                </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                            {items.map((item) => (
                                <div key={item.label} className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                    <div className="flex flex-col mb-2">
                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{item.label}</span>
                                        <span className="text-lg font-bold text-white">{item.val > 0 ? item.val : '-'} <span className="text-[10px] text-slate-500 font-normal">lbs</span></span>
                                    </div>

                                    {/* Bar */}
                                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                                            style={{ width: `${(item.val / maxVal) * 100}%` }}
                                        />
                                    </div>

                                    <div className="text-[10px] text-slate-500 flex justify-between items-center">
                                        <span>Best:</span>
                                        <span className="text-slate-300 font-mono text-[10px]">{item.log}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
