import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Save, Dumbbell, History, RefreshCw } from 'lucide-react';
// import { getAllExercises } from '../data/exercises';



export const Settings: React.FC = () => {
    const { equipment, updateEquipment, history, allExercises } = useWorkout();
    const [input, setInput] = useState(equipment);
    const [showModal, setShowModal] = useState(false);
    const [filteredExercises, setFilteredExercises] = useState<typeof allExercises>([]);
    const [previewCount, setPreviewCount] = useState(0);

    useEffect(() => {
        // Calculate preview of available exercises
        const rawItems = input.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        const hasWeights = rawItems.some(i => i.includes('dumb') || i.includes('bar') || i.includes('weight'));

        // Use allExercises from context (Local + API)
        const filtered = allExercises.filter(ex => {
            const req = ex.equipment.toLowerCase();
            if (req.includes('body')) return true;
            if (hasWeights && (req.includes('dumb') || req.includes('bar'))) return true;
            return rawItems.some(u => req.includes(u));
        });

        setFilteredExercises(filtered);
        setPreviewCount(filtered.length);
    }, [input, allExercises]);

    const handleSave = () => {
        updateEquipment(input);
        alert('Settings saved successfully!');
        // Visual feedback could be added here
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    onClick={() => setShowModal(true)}
                    className="glass-card p-4 text-center cursor-pointer hover:bg-slate-800/80 transition-colors"
                >
                    <Dumbbell className="mx-auto text-blue-400 mb-2" size={24} />
                    <div className="text-2xl font-bold">{previewCount}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Available Exercises</div>
                    <div className="text-[10px] text-blue-400 mt-1">Tap to view list</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <History className="mx-auto text-purple-400 mb-2" size={24} />
                    <div className="text-2xl font-bold">{history.length}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Workouts Completed</div>
                </div>
            </div>

            {/* Equipment Input */}
            <div className="glass-card p-6">
                <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                    My Equipment
                </label>
                <p className="text-sm text-slate-500 mb-4">
                    List your equipment below, separated by commas or new lines.
                    <br />Example: <em>Dumbbells, Bench, Pull-up Bar</em>
                </p>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="input-field min-h-[150px] mb-4 font-mono text-sm"
                    placeholder="Dumbbells, Bodyweight..."
                />

                <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
                    <Save size={20} />
                    Save Settings
                </button>
            </div>

            <div className="text-center text-xs text-slate-600 mt-8">
                FitGen v1.0.0
            </div>

            {/* Debug Section */}
            <div className="glass-card p-6 mb-24">
                <h3 className="text-xl font-bold text-white mb-4">Debug Info</h3>
                <pre className="text-xs text-slate-400 overflow-auto max-h-40 bg-slate-900 p-2 rounded">
                    {JSON.stringify(JSON.parse(localStorage.getItem('fitgen_store_v1') || '{}'), null, 2)}
                </pre>
            </div>

            <div className="glass-card p-6 mb-24">
                <h3 className="text-xl font-bold text-white mb-4">Account</h3>
                <div className="text-slate-400 text-sm mb-4">
                    Auto-synced to Cloud (Single User Mode)
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('fitgen_api_cache_v3');
                        localStorage.removeItem('fitgen_store_v1'); // Correct key
                        window.location.href = '/';
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18} />
                    Reset App Data (Fix Images)
                </button>
            </div>

            {/* Exercise List Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden relative">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                            <h3 className="font-bold text-lg text-white">Available Exercises ({filteredExercises.length})</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-2">
                            {filteredExercises.map((ex, i) => (
                                <div key={ex.id || i} className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-white">{ex.name}</div>
                                        <div className="text-xs text-slate-400">{ex.muscleGroup}</div>
                                    </div>
                                    <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                        {ex.equipment}
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
