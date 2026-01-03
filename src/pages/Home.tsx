import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { RefreshCw, CheckCircle2, X, GripVertical, Zap, Star, Trash2, Circle, MessageSquarePlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import confetti from 'canvas-confetti';

import { CustomizeWorkoutModal } from '../components/CustomizeWorkoutModal';
import { UpcomingWorkoutModal } from '../components/UpcomingWorkoutModal';
import { FunLoader } from '../components/FunLoader';
import { ProgressionCard } from '../components/ProgressionCard';
import { ProgressionService } from '../services/ProgressionService';
import { LogModal } from '../components/LogModal';

export const Home: React.FC = () => {
    const {
        dailyWorkout,
        history,

        currentSplit,
        excludeExercise,
        replaceExercise,
        reorderWorkout,
        toggleExerciseCompletion,
        focusArea,
        setFocusArea,
        customWorkoutActive,
        clearCustomWorkout,
        includeLegs,
        openaiApiKey,
        isGenerating,
        generationStatus,
        setSplit,
        logExercisePerformance, // Added for LogModal
        refineWorkout,
        strategyInsight
    } = useWorkout();
    const [previewImage, setPreviewImage] = React.useState<any | null>(null);
    const [isCustomizeOpen, setIsCustomizeOpen] = React.useState(false);

    // Custom Prompt State
    const [isPromptOpen, setIsPromptOpen] = React.useState(false);
    const [customPromptText, setCustomPromptText] = React.useState('');

    const handleCustomRefine = async () => {
        if (!customPromptText.trim()) return;
        await refineWorkout(customPromptText);
        setIsPromptOpen(false);
        setCustomPromptText('');
    };

    // NEW: Log Modal State and Handlers
    const [logModalOpen, setLogModalOpen] = React.useState(false);
    const [selectedExerciseForLog, setSelectedExerciseForLog] = React.useState<any | null>(null);

    const handleLogClick = (exercise: any) => {
        setSelectedExerciseForLog(exercise);
        setLogModalOpen(true);
    };

    const handleSaveLog = (val: string) => {
        if (selectedExerciseForLog) {
            logExercisePerformance(selectedExerciseForLog.id, val);
        }
        setLogModalOpen(false); // Close modal after saving
    };

    // Smart Instruction Generator (simulating AI)
    const getSmartInstructions = (exercise: any) => {
        const { name, equipment } = exercise;
        const nameLower = name.toLowerCase();

        let action = "Perform the movement with control.";
        let cue = "Keep your core engaged.";
        let breathing = "Exhale on exertion.";

        // 1. Analyze Movement Pattern
        if (nameLower.includes('press') || nameLower.includes('push')) {
            action = "Drive the weight away from you with explosive power, then control the return.";
            cue = "Keep your elbows tucked slightly to protect your shoulders.";
        } else if (nameLower.includes('row') || nameLower.includes('pull') || nameLower.includes('chin')) {
            action = "Pull through your elbows, visualizing them driving back behind you.";
            cue = "Squeeze your shoulder blades together at the peak of the movement.";
        } else if (nameLower.includes('squat') || nameLower.includes('lung')) {
            action = "Descend by breaking at the hips and knees simultaneously.";
            cue = "Keep your chest up and drive through your heels.";
        } else if (nameLower.includes('curl')) {
            action = "Curl the weight up while keeping your elbows pinned to your sides.";
            cue = "Squeeze the biceps hard at the top and lower slowly.";
        } else if (nameLower.includes('exten') || nameLower.includes('pushdown') || nameLower.includes('skull')) {
            action = "Extend your arm fully, targeting the triceps.";
            cue = "Keep your upper arm stationary only moving the forearm.";
        } else if (nameLower.includes('fly') || nameLower.includes('raise')) {
            action = "Move in a wide arc, maintaining a slight bend in your elbows.";
            cue = "Focus on the stretch at the bottom and the contraction at the top.";
        }

        // 2. Analyze Equipment
        if (equipment === 'Barbell') {
            breathing = "Take a deep breath and brace before you start.";
        } else if (equipment === 'Dumbbell') {
            breathing = "Mainain stability and don't let the weights drift.";
        } else if (equipment === 'Cable') {
            action += " Maintain constant tension throughout the rep.";
        } else if (equipment === 'Bodyweight') {
            cue += " Focus on perfect form and time under tension.";
        }

        return { action, cue, breathing };
    };


    // AI Summary logic replaced by strategyInsight from Context

    // NEW: Fun Loader State
    // isGenerating is now destructured from useWorkout()

    const stats = React.useMemo(() => ProgressionService.getBig4Stats(history), [history]);

    return (
        <div className="relative pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6">
            <CustomizeWorkoutModal isOpen={isCustomizeOpen} onClose={() => setIsCustomizeOpen(false)} />
            <UpcomingWorkoutModal isOpen={false} onClose={() => { }} />

            {/* Fun Loading Overlay */}
            <FunLoader visible={isGenerating} customMessage={generationStatus} />

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-700 flex items-start justify-between bg-slate-800/50">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{previewImage.name}</h3>

                                    {/* AI Instructions Block */}
                                    <div className="text-sm text-slate-300 space-y-1 mt-2 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                        <div className="flex gap-2">
                                            <span className="text-blue-400 font-bold shrink-0">ACTION:</span>
                                            <span>{getSmartInstructions(previewImage).action}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-emerald-400 font-bold shrink-0">CUE:</span>
                                            <span>{getSmartInstructions(previewImage).cue}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-4 bg-black flex items-center justify-center grow overflow-hidden flex-col">
                                {previewImage.gifUrl ? (
                                    <>
                                        <img
                                            src={previewImage.gifUrl}
                                            alt={previewImage.name}
                                            className="max-w-full max-h-[50vh] object-contain rounded-lg"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                                target.nextElementSibling?.classList.add('flex');
                                            }}
                                        />
                                        {/* Fallback for broken image (sibling) */}
                                        <div className="hidden flex-col items-center justify-center h-64 text-slate-500">
                                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-4xl">
                                                ⚠️
                                            </div>
                                            <p className="font-bold">Image Failed to Load</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-4xl">
                                            💪
                                        </div>
                                        <p className="font-bold">No Preview Available</p>
                                        <p className="text-xs mt-2">Try searching YouTube for:</p>
                                        <p className="text-sm font-bold text-white">"{previewImage.name} form"</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Log Modal */}
            <LogModal
                isOpen={logModalOpen}
                onClose={() => setLogModalOpen(false)}
                onSave={handleSaveLog}
                initialValue={selectedExerciseForLog?.reps || ""}
                exerciseName={selectedExerciseForLog?.name || ""}
            />

            {/* Header and Controls */}
            <div className="flex flex-col gap-4">
                {!openaiApiKey && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-200 text-sm">
                            <Zap size={16} className="text-amber-400" />
                            <span>AI Key missing. Features limited.</span>
                        </div>
                        <button
                            onClick={() => window.location.hash = '#/settings'} // Assuming simple hash routing or just text
                            // Actually, just tell them to go to settings.
                            className="text-xs font-bold text-amber-400 hover:text-amber-300"
                        >
                            Go to Settings
                        </button>
                    </div>
                )}

                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-white">Your {currentSplit} Workout</h1>
                    {focusArea !== 'Default' && <p className="text-slate-400 text-sm">Focus: {focusArea}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={currentSplit}
                        onChange={(e) => setSplit(e.target.value)}
                        className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-bold placeholder:text-slate-500"
                    >
                        <option value="Push">Push</option>
                        <option value="Pull">Pull</option>
                        {includeLegs && <option value="Legs">Legs</option>}
                    </select>

                    <select
                        value={customWorkoutActive ? 'Custom' : focusArea}
                        onChange={(e) => {
                            if (e.target.value === 'Custom') return; // Don't do anything, button handles it
                            if (customWorkoutActive) clearCustomWorkout(); // Clear custom if they pick dropdown
                            setFocusArea(e.target.value);
                        }}
                        className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                    >
                        <option value="Default">Standard Split</option>
                        <option value="Chest">Focus: Chest</option>
                        <option value="Back">Focus: Back</option>
                        {includeLegs && <option value="Legs">Focus: Legs</option>}
                        <option value="Shoulders">Focus: Shoulders</option>
                        <option value="Arms">Focus: Arms</option>
                        <option value="Bodyweight">Focus: Bodyweight / Travel</option>
                        {customWorkoutActive && <option value="Custom">Custom Selection</option>}
                    </select>

                </div>

            </div>

            {/* Custom AI Prompt Section */}
            <div className="w-full">
                <AnimatePresence mode="wait">
                    {!isPromptOpen ? (
                        <div className="flex flex-col gap-2">
                            {/* Strategy Insight (If exists) */}
                            {strategyInsight && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl text-indigo-200 text-sm flex gap-3 shadow-lg shadow-indigo-900/10 backdrop-blur-sm"
                                >
                                    <Sparkles size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-indigo-300 text-xs uppercase tracking-widest mb-1">AI Strategy</p>
                                        <p className="text-indigo-100 leading-relaxed font-medium">{strategyInsight}</p>
                                    </div>
                                </motion.div>
                            )}

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setIsPromptOpen(true)}
                                className="w-full py-3 px-4 rounded-xl border border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 text-slate-400 text-sm font-bold hover:from-slate-700 hover:to-slate-800 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2 group shadow-lg"
                            >
                                <MessageSquarePlus size={18} className="group-hover:text-blue-400 transition-colors" />
                                <span>Customize workout...</span>
                            </motion.button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ height: 0, opacity: 0, scale: 0.95 }}
                            animate={{ height: 'auto', opacity: 1, scale: 1 }}
                            exit={{ height: 0, opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden ring-1 ring-blue-500/20"
                        >
                            <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                                <Sparkles size={14} /> AI Custom Instructions
                            </label>
                            <textarea
                                value={customPromptText}
                                onChange={(e) => setCustomPromptText(e.target.value)}
                                placeholder="Describe your needs (e.g. 'Shoulder injury, avoid overhead pressing' or 'Focus on triceps')..."
                                className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none placeholder:text-slate-600 mb-4 min-h-[100px] resize-none transition-all"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsPromptOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCustomRefine}
                                    disabled={!customPromptText.trim()}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform active:scale-95"
                                >
                                    <Sparkles size={16} />
                                    Refine Plan
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Progression Card */}
            {
                history.length > 0 && (
                    <div className="mb-4">
                        <ProgressionCard stats={stats} />
                    </div>
                )
            }

            {/* Exercise List */}
            <Reorder.Group axis="y" values={dailyWorkout} onReorder={reorderWorkout} className="space-y-3 pb-8 list-none">
                <AnimatePresence mode="popLayout">
                    {dailyWorkout.map((exercise) => (
                        <ExerciseItem
                            key={exercise.id || exercise.name}
                            exercise={exercise}
                            toggleExerciseCompletion={toggleExerciseCompletion}
                            setPreviewImage={setPreviewImage}
                            replaceExercise={replaceExercise}
                            excludeExercise={excludeExercise}
                            onLogClick={handleLogClick} // Pass the new handler
                        />
                    ))}
                </AnimatePresence>
            </Reorder.Group>

            {
                dailyWorkout.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <p>No exercises found for your equipment.</p>
                        <p className="text-sm mt-2">Update your settings to add equipment.</p>
                    </div>
                )
            }

            {/* Finish Workout Button REMOVED */}
        </div >
    );
};

// Extracted component for Drag Controls
const ExerciseItem = ({
    exercise,
    toggleExerciseCompletion,
    setPreviewImage,
    replaceExercise,
    excludeExercise,
    onLogClick // Added onLogClick prop
}: any) => {
    const controls = useDragControls();
    const { favorites, toggleFavorite } = useWorkout(); // Removed logExercisePerformance: logContext
    const timeoutRef = React.useRef<any>(null);
    // Removed isEditing, weight, reps, weightRef states

    // Removed useEffect for isEditing and handleLogSubmit

    const isFavorite = favorites.includes(exercise.name);

    // Trigger confetti on completion
    const handleCompletion = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleExerciseCompletion(exercise.id);
        if (!exercise.completed) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        timeoutRef.current = setTimeout(() => {
            controls.start(e);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 300);
    };

    const handlePointerUp = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    return (
        <Reorder.Item
            value={exercise}
            dragListener={false}
            dragControls={controls}
            className={`select-none ${exercise.completed ? 'grayscale opacity-60' : ''}`}
        >
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`relative glass-card p-3 flex gap-3 group ${exercise.completed ? 'opacity-50 grayscale' : ''}`}
            >
                {/* Drag Handle Area - Expanded touch target */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-start pl-2 cursor-grab active:cursor-grabbing z-10"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                >
                    <GripVertical size={16} className="text-slate-600" />
                </div>

                {/* Main Content Layout */}
                <div className="flex gap-3 w-full pl-6">
                    {/* Thumbnail */}
                    <div onClick={() => setPreviewImage(exercise)} className="shrink-0 cursor-pointer relative group/thumb" title="Click to view instructions">
                        {exercise.gifUrl ? (
                            <img
                                src={exercise.gifUrl}
                                alt={exercise.name}
                                className={`w-16 h-16 rounded-lg object-cover bg-slate-800 transition-all ${exercise.completed ? 'opacity-50 grayscale' : 'group-hover/thumb:ring-2 ring-indigo-500'}`}
                                loading="lazy"
                            />
                        ) : (
                            <div className={`w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-lg text-slate-500 font-bold ${exercise.completed ? 'opacity-50' : 'group-hover/thumb:ring-2 ring-indigo-500'}`}>
                                {exercise.name.slice(0, 2)}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Title on Top, Info+Actions below */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
                        {/* Top: Title */}
                        <div className="w-full" onClick={() => setPreviewImage(exercise)}>
                            <h3 className={`text-base font-bold text-white truncate ${exercise.completed ? 'line-through text-slate-500' : ''}`}>
                                {exercise.name}
                            </h3>
                        </div>

                        {/* Bottom: Badges + Actions */}
                        <div className="flex items-end justify-between gap-2 mt-1">
                            {/* Badges / Info */}
                            <div className="min-w-0 flex flex-col gap-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded w-fit bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider truncate max-w-[100px]">
                                    {exercise.muscleGroup}
                                </span>
                                <p
                                    onClick={(e) => { e.stopPropagation(); onLogClick(exercise); }}
                                    className="text-[10px] text-slate-500 truncate cursor-pointer hover:text-blue-400 flex items-center gap-1 w-fit focus:bg-white/10 rounded px-1 -ml-1 transition-colors"
                                >
                                    {exercise.reps} <span className="text-slate-600">✏️</span>
                                </p>
                            </div>

                            {/* Actions Row */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); replaceExercise(exercise.name); }}
                                    className="p-1.5 text-slate-500 hover:text-blue-400 rounded-full hover:bg-white/5"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(exercise.name); }}
                                    className={`p-1.5 rounded-full hover:bg-white/5 ${isFavorite ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                                >
                                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); excludeExercise(exercise.name); }}
                                    className="p-1.5 text-slate-500 hover:text-red-500 rounded-full hover:bg-white/5"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={handleCompletion}
                                    className={`p-1.5 rounded-full border border-transparent ${exercise.completed
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                        : 'bg-white/5 text-slate-400 hover:text-emerald-400'
                                        }`}
                                >
                                    {exercise.completed ? <CheckCircle2 size={18} strokeWidth={3} /> : <Circle size={18} strokeWidth={2} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};
