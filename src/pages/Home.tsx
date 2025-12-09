import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { RefreshCw, CheckCircle2, X, GripVertical, Zap, Star, Trash2, Circle } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import confetti from 'canvas-confetti';

import { CustomizeWorkoutModal } from '../components/CustomizeWorkoutModal';
import { UpcomingWorkoutModal } from '../components/UpcomingWorkoutModal';
import { FunLoader } from '../components/FunLoader';

export const Home: React.FC = () => {
    const {
        dailyWorkout,
        refreshWorkout,
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
        generationStatus
    } = useWorkout();
    const [previewImage, setPreviewImage] = React.useState<any | null>(null);
    const [isCustomizeOpen, setIsCustomizeOpen] = React.useState(false);

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
                            <div className="p-4 bg-black flex items-center justify-center grow overflow-hidden">
                                <img
                                    src={previewImage.gifUrl}
                                    alt={previewImage.name}
                                    className="max-w-full max-h-[50vh] object-contain rounded-lg"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    <button
                        onClick={refreshWorkout}
                        className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-lg border border-slate-700"
                        title="Regenerate Workout"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

            </div>

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
    excludeExercise
}: any) => {
    const controls = useDragControls();
    const { favorites, toggleFavorite } = useWorkout();
    const timeoutRef = React.useRef<any>(null);

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
            className={`touch-none select-none ${exercise.completed ? 'grayscale opacity-60' : ''}`}
        >
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`relative glass-card p-4 flex items-center gap-4 group ${exercise.completed ? 'opacity-50 grayscale' : ''}`}
            >
                {/* Drag Handle Area */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                >
                    <GripVertical size={16} className="text-slate-600" />
                </div>

                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Thumbnail - Bigger now (w-20) */}
                    <div onClick={() => setPreviewImage(exercise)} className="shrink-0 cursor-pointer relative group/thumb" title="Click to view instructions">
                        {exercise.gifUrl ? (
                            <img
                                src={exercise.gifUrl}
                                alt={exercise.name}
                                className={`w-20 h-20 rounded-lg object-cover bg-slate-800 transition-all ${exercise.completed ? 'opacity-50 grayscale' : 'group-hover/thumb:ring-2 ring-indigo-500'}`}
                                loading="lazy"
                            />
                        ) : (
                            <div className={`w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center text-xl text-slate-500 font-bold ${exercise.completed ? 'opacity-50' : 'group-hover/thumb:ring-2 ring-indigo-500'}`}>
                                {exercise.name.slice(0, 2)}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0" onClick={() => setPreviewImage(exercise)} title="Click to view instructions">
                        <h3 className={`text-lg font-bold text-white truncate ${exercise.completed ? 'line-through text-slate-500' : ''}`}>
                            {exercise.name}
                        </h3>
                        {/* Muscle/Equipment Badge */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                                {exercise.muscleGroup}
                            </span>
                            {exercise.equipment !== 'Bodyweight' && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/30">
                                    {exercise.equipment}
                                </span>
                            )}
                            {exercise.isCustom && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/30 flex items-center gap-1">
                                    AI <Zap size={8} />
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 truncate">
                            {exercise.reps} {exercise.notes && `• ${exercise.notes}`}
                        </p>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                    {/* Refresh / Swap */}
                    <button
                        onClick={(e) => { e.stopPropagation(); replaceExercise(exercise.name); }}
                        className="p-2 text-slate-500 hover:text-blue-400 transition-colors rounded-full hover:bg-white/5"
                        title="Swap with another exercise"
                    >
                        <RefreshCw size={18} />
                    </button>

                    {/* Favorite */}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(exercise.name); }}
                        className={`p-2 transition-colors rounded-full hover:bg-white/5 ${isFavorite ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                        <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
                    </button>

                    {/* Remove / Exclude */}
                    <button
                        onClick={(e) => { e.stopPropagation(); excludeExercise(exercise.name); }}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors rounded-full hover:bg-white/5"
                        title="Remove forever (Exclude)"
                    >
                        <Trash2 size={18} />
                    </button>

                    {/* Complete Button - Main Action */}
                    <button
                        onClick={handleCompletion}
                        className={`p-2 rounded-full transition-all duration-300 border border-transparent ${exercise.completed
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30'
                            }`}
                        title={exercise.completed ? "Completed!" : "Mark as Complete"}
                    >
                        {exercise.completed ? <CheckCircle2 size={20} strokeWidth={3} /> : <Circle size={20} strokeWidth={2} />}
                    </button>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};
