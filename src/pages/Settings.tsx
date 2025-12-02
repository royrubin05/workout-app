import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Save, Dumbbell, History, RefreshCw } from 'lucide-react';
// import { getAllExercises } from '../data/exercises';



export const Settings: React.FC = () => {
    const { equipment, updateEquipment, history, allExercises, getAvailableExercises, excludedExercises, restoreExercise, connectionStatus, connectionError, lastSyncTime, toggleBodyweight, includeBodyweight } = useWorkout();
    const [input, setInput] = useState(equipment);
    const [showModal, setShowModal] = useState(false);
    const [filteredExercises, setFilteredExercises] = useState<typeof allExercises>([]);
    const [previewCount, setPreviewCount] = useState(0);

    useEffect(() => {
        // Use the robust matching logic from Context
        const filtered = getAvailableExercises(input);

        setFilteredExercises(filtered);
        setPreviewCount(filtered.length);
    }, [input, getAvailableExercises]);

    const handleSave = () => {
        updateEquipment(input);
        alert('Settings saved successfully!');
        // Visual feedback could be added here
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${connectionStatus === 'connected'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    < div className="space-y-6 pb-24">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-white">Settings</h1>
                        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="text-xs text-slate-400 font-medium">
                                {connectionStatus === 'connected' ? (
                                    <span>Synced {lastSyncTime && `• ${lastSyncTime}`}</span>
                                ) : (
                                    <span title={connectionError || 'Unknown Error'}>
                                        Offline {connectionError && `(${connectionError})`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* My Equipment */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">My Equipment</h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                {previewCount} Available Exercises
                            </button>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            placeholder="Enter your equipment (e.g. Dumbbells, Pull-up bar, Bands...)"
                        />
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
                                <Save size={20} />
                                Save Settings
                            </button>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Preferences</h3>

                        {/* Bodyweight Toggle */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Dumbbell size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Include Bodyweight Exercises</div>
                                    <div className="text-xs text-slate-400">Push-ups, Lunges, etc.</div>
                                </div>
                            </div>
                            <button
                                onClick={toggleBodyweight}
                                className={`w-12 h-6 rounded-full transition-colors relative ${includeBodyweight ? 'bg-blue-500' : 'bg-slate-700'
                                    }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${includeBodyweight ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Excluded Exercises Button */}
                        <div className="flex items-center justify-between border-t border-slate-700/50 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                                    <MinusCircle size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Excluded Exercises</div>
                                    <div className="text-xs text-slate-400">{excludedExercises.length} exercises banned</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowExcludedModal(true)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                            >
                                Manage List
                            </button>
                        </div>
                    </div>

                    {/* Available Exercises Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 rounded-t-2xl">
                                    <h3 className="text-lg font-bold text-white">Available Exercises ({filteredExercises.length})</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {filteredExercises.map((ex, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                                            <img
                                                src={ex.gifUrl}
                                                alt={ex.name}
                                                className="w-12 h-12 rounded-lg object-cover bg-slate-700"
                                                loading="lazy"
                                            />
                                            <div>
                                                <div className="font-medium text-white">{ex.name}</div>
                                                <div className="text-xs text-slate-400">{ex.muscleGroup} • {ex.equipment}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                );
};
