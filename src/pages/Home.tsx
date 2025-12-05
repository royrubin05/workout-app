import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { RefreshCw, MinusCircle, CheckCircle2, X, GripVertical, Brain } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';

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
        setFocusArea
    } = useWorkout();
    const [previewImage, setPreviewImage] = React.useState<any | null>(null);

    // Removed handleComplete as we now auto-log via state

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
        <div className="relative">
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

            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-1">
                            Today's Focus: <span className="text-white font-bold">{currentSplit}</span>
                        </h2>
                        <h3 className="text-2xl font-bold text-white">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={focusArea}
                            onChange={(e) => setFocusArea(e.target.value)}
                            className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="Default">Standard Split</option>
                            <option value="Chest">Focus: Chest</option>
                            <option value="Back">Focus: Back</option>
                            <option value="Legs">Focus: Legs</option>
                            <option value="Shoulders">Focus: Shoulders</option>
                            <option value="Arms">Focus: Arms</option>
                            <option value="Bodyweight">Focus: Bodyweight / Travel</option>
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

                {/* AI Summary Card */}
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-indigo-500/30 flex gap-3 items-start">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 shrink-0">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h4 className="text-indigo-200 font-bold text-sm mb-1">AI Strategy Insight</h4>
                        <p className="text-indigo-100/80 text-sm leading-relaxed">
                            {getAISummary()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="pb-24">
                <Reorder.Group axis="y" values={dailyWorkout} onReorder={reorderWorkout} className="space-y-3">
                    <AnimatePresence>
                        {dailyWorkout.map((exercise) => (
                            <ExerciseItem
                                key={exercise.name}
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
        </div>
    );
};

// Extracted component for Drag Controls
const ExerciseItem = ({ exercise, toggleExerciseCompletion, setPreviewImage, replaceExercise, excludeExercise }: any) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={exercise}
            dragListener={false}
            dragControls={controls}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative"
        >
            <div className={`glass-card p-4 flex items-center gap-4 group transition-all ${exercise.completed ? 'opacity-60 bg-slate-900/50' : ''}`}>
                {/* Drag Handle - ONLY this triggers drag */}
                <div
                    className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-2 -ml-2 touch-none"
                    onPointerDown={(e) => controls.start(e)}
                >
                    <GripVertical size={20} />
                </div>

                {/* Image */}
                <div
                    className={`w-16 h-16 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xl overflow-hidden border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors ${exercise.completed ? 'grayscale' : ''}`}
                    onClick={() => exercise.gifUrl && setPreviewImage(exercise)}
                >
                    {exercise.gifUrl ? (
                        <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{exercise.name[0]}</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-lg text-white mb-1 truncate ${exercise.completed ? 'line-through text-slate-500' : ''}`}>
                        {exercise.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium">
                            {exercise.equipment}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-medium">
                            {exercise.muscleGroup}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toggleExerciseCompletion(exercise.name)}
                        className={`p-3 rounded-xl transition-all ${exercise.completed
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <CheckCircle2 size={24} />
                    </button>

                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => replaceExercise(exercise.name)}
                            className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                            title="Swap Exercise"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => excludeExercise(exercise.name)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Exclude Exercise"
                        >
                            <MinusCircle size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
};
