import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { SmartParser } from '../utils/smartParser';
import { RefreshCw, MinusCircle, CheckCircle2, X, GripVertical, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { triggerConfetti } from '../utils/confetti';

import { CustomizeWorkoutModal } from '../components/CustomizeWorkoutModal';
import { UpcomingWorkoutModal } from '../components/UpcomingWorkoutModal';

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
        history: contextHistory,
        customWorkoutActive,
        customTargets,
        clearCustomWorkout
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


    // AI Summary Generator (Strategy & Tactics)
    const getAISummary = () => {
        if (dailyWorkout.length === 0) return "Add equipment to generate a workout plan.";

        // Special handling for Custom Workouts
        if (customWorkoutActive && customTargets.length > 0) {
            const targetsStr = customTargets.join(' & ');
            const summary = `You've configured a custom session targeting **${targetsStr}**. Focus on maintaining intensity across these specific areas. Since this is a custom mix, pay extra attention to your recovery between sets.`;
            return summary;
        }

        const focus = focusArea === 'Default' ? currentSplit : focusArea;

        // Dynamic Tips Database (High Level Principles)
        const strategies: Record<string, string[]> = {
            'Chest': [
                "Focus: Maximum Contraction. Squeeze the pecs hard at the top of every rep to recruit more fibers.",
                "Technique: Keep your shoulders pinned back (retracted) to prevent the front delts from taking over.",
                "Tempo: Control the negative (lowering) phase for 2-3 seconds to stimulate hypertrophy."
            ],
            'Back': [
                "Focus: Mind-Muscle Connection. Visualize your hands as hooks and pull with your elbows.",
                "Technique: Initiate every pull by depressing your scapula before bending your arms.",
                "Tempo: Pause for a full second at the peak of the contraction to eliminate momentum."
            ],
            'Legs': [
                "Focus: Intensity. Leg growth requires pushing near failure. Keep tension on the muscles, not the joints.",
                "Technique: Drive through your heels on presses and squats to better engage the posterior chain.",
                "Tempo: Don't lock out your knees at the top. Keep constant tension on the quads."
            ],
            'Shoulders': [
                "Focus: Time Under Tension. The delts respond well to constant tension and higher rep ranges.",
                "Technique: Lead with your elbows on lateral movements to target the side delts effectively.",
                "Tempo: Avoid using body English (swinging). Strict form builds bigger shoulders."
            ],
            'Arms': [
                "Focus: Isolation. Lock your elbows in place. Any movement at the shoulder reduces arm activation.",
                "Technique: Supinate (twist) your pinky toward the ceiling on bicep curls for a peak contraction.",
                "Tempo: Squeeze the triceps hard at full extension. The lockout is where the growth happens."
            ],
            'Push': [
                "Strategy: Heavy & Volume. We're hitting the pressing muscles from multiple angles.",
                "Tip: Manage fatigue. If your shoulders tire out before your chest/triceps, reduce the weight and focus on form.",
            ],
            'Pull': [
                "Strategy: Posterior Chain. This session targets width and thickness for a complete back.",
                "Tip: Grip strength can be a limiting factor. Use straps if needed to fully tax the back muscles.",
            ],
            'Bodyweight': [
                "Strategy: High Frequency & Volume. Without heavy loads, we rely on more reps and less rest.",
                "Tip: Focus on explosive concentrics (up) and slow, controlled eccentrics (down) to mimic heavy lifting.",
                "Tip: Minimize rest times. Keep your heart rate up to induce metabolic stress."
            ]
        };

        const specificTips = strategies[focus] || strategies['Push']; // Fallback
        const randomTip = specificTips[new Date().getDate() % specificTips.length];

        // Generic Intro based on focus
        let intro = `Today's **${currentSplit}** session`;
        if (focusArea !== 'Default') {
            intro += ` has a special focus on **${focusArea}**.`;
        } else {
            intro += ` targets the entire pushing chain.`;
        }

        return `${intro} ${randomTip}`;
    };

    return (
        <div className="relative pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6">
            <CustomizeWorkoutModal isOpen={isCustomizeOpen} onClose={() => setIsCustomizeOpen(false)} />
            <UpcomingWorkoutModal isOpen={false} onClose={() => { }} />

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
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Your Workout</h1>
                    <button
                        onClick={() => setIsCustomizeOpen(true)}
                        className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-lg border border-slate-700"
                        title="Customize Workout"
                    >
                        <Brain size={20} />
                    </button>
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
                        <option value="Legs">Focus: Legs</option>
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

                {/* AI Summary Card */}
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-indigo-500/30 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 shrink-0">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="text-indigo-200 font-bold text-sm mb-1">AI Strategy Insight</h4>
                        <p className="text-indigo-100/80 text-sm leading-relaxed">
                            {getAISummary()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Exercise List */}
            <Reorder.Group axis="y" values={dailyWorkout} onReorder={reorderWorkout} className="space-y-3 pb-8">
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

            {dailyWorkout.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>No exercises found for your equipment.</p>
                    <p className="text-sm mt-2">Update your settings to add equipment.</p>
                </div>
            )}
        </div>
    );
};

// Extracted component for Drag Controls
const ExerciseItem = ({ exercise, toggleExerciseCompletion, setPreviewImage, replaceExercise, excludeExercise }: any) => {
    const controls = useDragControls();
    const { favorites, toggleFavorite } = useWorkout();
    const timeoutRef = React.useRef<any>(null);

    const isFavorite = favorites.includes(exercise.name);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Prevent default browser behavior (scrolling) only if we decide to drag?
        // Actually, with touch-none, scrolling is disabled on the handle anyway.
        // But to allow scrolling if they just brush it, we might want to remove touch-none?
        // For now, adhering to "long press to reorder".
        // Use e.persist() or capture event properties if needed, but synchronous start is best?
        // Note: Framer Motion controls.start(e) typically needs to be called synchronously on PointerDown
        // for some browsers constraints, but let's try the timeout.

        // Actually, passing the event async works in most modern React/Framer versions as long as the event object exists.
        // We persist the event just in case (though React 17+ doesn't pool).

        timeoutRef.current = setTimeout(() => {
            controls.start(e);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50); // Haptic feedback
            }
        }, 300); // 300ms hold
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
            className="touch-none select-none"
        >
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`relative overflow-hidden glass-card p-4 flex items-center justify-between group ${exercise.completed ? 'opacity-50 grayscale' : ''}`}
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

                <div className="flex items-center gap-4 pl-8 flex-1">
                    <button
                        onClick={() => toggleExerciseCompletion(exercise.id)}
                        className={`shrink-0 transition-colors ${exercise.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                        {exercise.completed ? <CheckCircle2 size={24} /> : <MinusCircle size={24} />}
                    </button>
                    <div className="flex-1 min-w-0" onClick={() => setPreviewImage(exercise)}>
                        <h3 className={`font-bold text-white truncate ${exercise.completed ? 'line-through text-slate-500' : ''}`}>
                            {exercise.name}
                        </h3>
                        {/* Muscle/Equipment Badge */}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {exercise.muscleGroup}
                            </span>
                            {exercise.equipment !== 'Bodyweight' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/30">
                                    {exercise.equipment}
                                </span>
                            )}
                            {exercise.isCustom && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/30 flex items-center gap-1">
                                    AI <Zap size={8} />
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                            {exercise.sets} sets • {exercise.reps} • {exercise.notes}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(exercise.name);
                        }}
                        className={`p-2 transition-colors ${isFavorite ? 'text-yellow-500' : 'text-slate-600 hover:text-yellow-500/50'}`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>

                    {/* Replacement Actions */}
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); replaceExercise(exercise.id); }}
                            className="p-1.5 text-slate-600 hover:text-blue-400 bg-slate-800/50 rounded"
                            title="Swap Exercise"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); excludeExercise(exercise.name); }}
                            className="p-1.5 text-slate-600 hover:text-red-400 bg-slate-800/50 rounded"
                            title="Exclude Exercise"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};
