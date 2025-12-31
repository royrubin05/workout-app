import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Dumbbell, Star, Plus, Trash2, CalendarDays, CheckCircle2, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UpcomingWorkoutModal } from '../components/UpcomingWorkoutModal';

export const Settings: React.FC = () => {
    const {
        excludedExercises,
        restoreExercise,
        favorites,
        toggleFavorite,
        customExercises,
        addCustomExercise,
        deleteCustomExercise,
        userEquipmentProfile, // Added state access
        updateUserEquipmentProfile,
        openaiApiKey,
        setOpenaiApiKey,
        connectionStatus,
        includeLegs, // Added by user's instruction
        toggleLegs, // Added by user's instruction

        cycleIndex,
        clearHistory
    } = useWorkout();

    const [activeTab, setActiveTab] = useState<'equipment' | 'favorites' | 'custom'>('equipment');
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);
    const [selectedFavorite, setSelectedFavorite] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState(openaiApiKey || '');
    const [showKeyInput, setShowKeyInput] = useState(false);

    // Update local key state when context updates (e.g. from cloud load)
    React.useEffect(() => {
        if (openaiApiKey) setApiKey(openaiApiKey);
    }, [openaiApiKey]);

    // UI State for Profile Init
    const [localProfile, setLocalProfile] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    // Sync local state with context on load
    React.useEffect(() => {
        if (userEquipmentProfile) {
            setLocalProfile(userEquipmentProfile);
        }
    }, [userEquipmentProfile]);

    // Save API Key
    const handleSaveKey = (key: string) => {
        setApiKey(key);
        setOpenaiApiKey(key);
    };

    // Custom Exercise Form State
    const [newExercise, setNewExercise] = useState({
        name: '',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight'
    });
    const [showSuccessModal, setShowSuccessModal] = React.useState(false); // Success modal state
    const [customSuccessExercise, setCustomSuccessExercise] = useState<any>(null); // New state for modal data
    const [showResetConfirm, setShowResetConfirm] = useState(false); // Reset modal state


    return (
        <div className="min-h-screen pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6">
            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div
                        className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Profile Saved!</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                We have scanned your equipment and filtered your exercise library.
                            </p>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Awesome
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* CUSTOM SUCCESS MODAL */}
            {customSuccessExercise && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setCustomSuccessExercise(null)}
                >
                    <div
                        className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400 text-3xl">
                                {customSuccessExercise.muscleGroup === 'Legs' ? '🦵' :
                                    customSuccessExercise.muscleGroup === 'Chest' ? '👕' :
                                        customSuccessExercise.muscleGroup === 'Back' ? '🎒' :
                                            customSuccessExercise.muscleGroup === 'Arms' ? '💪' : '✨'}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{customSuccessExercise.name}</h3>
                            <div className="flex gap-2 mb-6">
                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {customSuccessExercise.muscleGroup}
                                </span>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {customSuccessExercise.equipment}
                                </span>
                            </div>
                            <button
                                onClick={() => setCustomSuccessExercise(null)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                            >
                                Awesome
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <UpcomingWorkoutModal isOpen={showUpcomingModal} onClose={() => setShowUpcomingModal(false)} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Settings</h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${apiKey ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                    >
                        {apiKey ? 'AI Active' : 'Enable AI'}
                    </button>
                    {/* Sync Status Badge */}
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="text-xs text-slate-400 font-medium">
                            {connectionStatus === 'connected' ? 'Synced' : 'Offline'}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Key Input */}
            {/* AI Key Input */}
            {showKeyInput && (
                <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-500/30 mb-4 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-indigo-300 mb-2 block">
                        OPENAI API KEY
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                            onClick={() => handleSaveKey(apiKey)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                            SAVE
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        This key is stored securely on your device and synced to your private database.
                    </p>
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Link to="/reports" className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-800/80 transition-colors group text-center">
                    <HistoryIcon className="text-emerald-400 group-hover:scale-110 transition-transform" size={24} />
                    <span className="text-sm font-bold text-slate-200">History</span>
                </Link>
                <button
                    onClick={() => setShowUpcomingModal(true)}
                    className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-800/80 transition-colors group text-center"
                >
                    <CalendarDays className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
                    <span className="text-sm font-bold text-slate-200">Next Workout</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                {[
                    { id: 'equipment', label: 'Equipment', icon: Dumbbell },
                    { id: 'favorites', label: 'Favorites', icon: Star },
                    { id: 'custom', label: 'Custom', icon: Plus }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-400' : ''} />
                        {tab.label}
                    </button>
                ))}
            </div>



            <div className="glass-card p-6 min-h-[400px]">

                {/* EQUIPMENT TAB - AI PROFILE MODE */}
                {activeTab === 'equipment' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 rounded-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        ✨ Equipment Profile
                                    </h2>
                                    <p className="text-xs text-indigo-300/80 mt-1">
                                        Describe your available equipment naturally. The AI will filter exercises to match exactly what you have.
                                    </p>
                                </div>
                            </div>

                            <textarea
                                value={localProfile}
                                onChange={(e) => setLocalProfile(e.target.value)}
                                placeholder="I have a home gym with dumbbells, a bench, and a pull-up bar..."
                                className="w-full h-32 bg-slate-900/50 border border-indigo-500/30 rounded-lg p-4 text-sm text-white placeholder-indigo-200/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            />

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={async () => {
                                        setIsScanning(true);
                                        await updateUserEquipmentProfile(localProfile);
                                        setIsScanning(false);
                                        setShowSuccessModal(true); // Show modal instead of alert
                                    }}
                                    disabled={isScanning || !apiKey}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${!apiKey ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                                        isScanning ? 'bg-indigo-600 cursor-wait opacity-80' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                        }`}
                                >
                                    {isScanning ? (
                                        <>Scanning...</>
                                    ) : (
                                        <>
                                            {!apiKey ? 'Enable AI First' : 'Save & Scan Exercises'}
                                        </>
                                    )}
                                </button>
                            </div>
                            {!apiKey && (
                                <p className="text-[10px] text-red-400 mt-2 text-right">
                                    * AI features require an API Key (Top Right)
                                </p>
                            )}
                        </div>

                        {excludedExercises.length > 0 && (
                            <div className="pt-6 border-t border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Manually Excluded</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {excludedExercises.map(ex => (
                                        <div key={ex} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-300 text-sm">{ex}</span>
                                            <button
                                                onClick={() => restoreExercise(ex)}
                                                className="text-emerald-400 text-xs font-bold hover:text-emerald-300"
                                            >
                                                RESTORE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* FAVORITES TAB */}
                {activeTab === 'favorites' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-white">Your Favorites</h2>
                            <span className="text-xs text-slate-500 font-medium">{favorites.length} items</span>
                        </div>

                        {favorites.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                                <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No favorites yet.</p>
                                <p className="text-sm mt-1">Tap the star icon on any exercise to add it here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                {favorites.map(fav => (
                                    <div
                                        key={fav}
                                        onClick={() => setSelectedFavorite(fav)}
                                        className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg border border-slate-700 group hover:border-slate-600 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                                            <span className="text-slate-200 font-medium text-sm">{fav}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(fav);
                                            }}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Favorite"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Favorite Details Modal */}
                {selectedFavorite && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedFavorite(null)}
                    >
                        <div
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="h-48 bg-slate-800 flex items-center justify-center relative">
                                {/* Use parsed info or find in allExercises? For now just showing name since we have string favorite */}
                                <div className="text-6xl">💪</div>
                                <button
                                    onClick={() => setSelectedFavorite(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white hover:bg-black/40"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{selectedFavorite}</h3>
                                <div className="text-slate-400 text-sm mb-6">
                                    Favorite Exercise
                                </div>
                                <button
                                    onClick={() => {
                                        toggleFavorite(selectedFavorite);
                                        setSelectedFavorite(null);
                                    }}
                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 size={18} />
                                    Remove from Favorites
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CUSTOM EXERCISES TAB */}
                {activeTab === 'custom' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                            <h3 className="text-lg font-bold text-white mb-2">Create New Exercise</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                Describe the exercise you want to add. Our AI will automatically categorize it for you.
                            </p>

                            <div className="space-y-4">
                                <textarea
                                    value={newExercise.name} // We reusing 'name' field for the prompt temporarily or should we change state? Let's use name.
                                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none placeholder-slate-600"
                                    placeholder="e.g. I want to do glute kickbacks using the cable machine..."
                                />

                                <button
                                    onClick={async () => {
                                        if (!newExercise.name) return;
                                        setIsScanning(true); // Reuse scanning state for loading
                                        try {
                                            const added = await addCustomExercise(newExercise.name);
                                            setCustomSuccessExercise(added); // Save added exercise details
                                            setNewExercise({ ...newExercise, name: '' });
                                        } catch (e) {
                                            alert("Failed to add exercise. Please try again.");
                                        } finally {
                                            setIsScanning(false);
                                        }
                                    }}
                                    disabled={!newExercise.name || isScanning}
                                    className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${!newExercise.name || isScanning
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20'
                                        }`}
                                >
                                    {isScanning ? (
                                        <>✨ Analyzing...</>
                                    ) : (
                                        <>
                                            <Plus size={20} /> Add to Library
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {customExercises.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Your Library</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {customExercises.map(ex => (
                                        <div key={ex.id || ex.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 group">
                                            <div>
                                                <div className="text-slate-200 font-bold text-sm">{ex.name}</div>
                                                <div className="text-xs text-slate-500">{ex.muscleGroup} • {ex.equipment}</div>
                                            </div>
                                            <button
                                                onClick={() => deleteCustomExercise(ex.name)}
                                                className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PREFERENCES SECTION */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <Dumbbell className="text-blue-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Workout Preferences</h2>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="space-y-1">
                        <div className="text-white font-medium">Include Legs + Lower Body</div>
                        <div className="text-xs text-slate-400">Enable to include squats, lunges, and leg machines.</div>
                    </div>
                    <button
                        onClick={() => toggleLegs(!includeLegs)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${includeLegs ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${includeLegs ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-700/50">
                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-1">Active Cycle: Upper Body</div>
                            <div className="text-white font-bold text-lg">Day {['A', 'B', 'C', 'D'][cycleIndex % 4]}</div>
                            <div className="text-xs text-slate-400 mb-1">
                                {['Push (Strength)', 'Pull (Hypertrophy)', 'Push (Volume)', 'Pull (Variation)'][cycleIndex % 4]}
                            </div>
                            <div className="text-[10px] text-slate-500 italic">
                                Auto-advances on completion
                            </div>
                        </div>
                        <div className="text-4xl grayscale opacity-50">
                            {['🏋️', '🦎', '💪', '🦍'][cycleIndex % 4]}
                        </div>
                    </div>
                </div>
            </div>

            {/* DANGER ZONE (Disabled after initial reset)
            <div className="glass-card p-6 border-red-500/20">
                <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                    <Trash2 size={16} /> Danger Zone
                </h3>
                <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-lg border border-red-500/20 transition-colors"
                >
                    Reset Account Data
                </button>
            </div>
            */}

            {/* RESET CONFIRMATION MODAL */}
            {showResetConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowResetConfirm(false)}
                >
                    <div
                        className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                This will permanently delete your workout history and 1RM stats. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        clearHistory();
                                        setShowResetConfirm(false);
                                        // Optional: Show success toast
                                    }}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                                >
                                    Delete Everything
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center text-xs text-slate-600 font-medium pb-8">
                v1.23
            </div>
        </div>
    );
};
