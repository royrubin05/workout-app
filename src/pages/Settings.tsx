import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Trash2, Plus, Star, Dumbbell, CalendarDays, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UpcomingWorkoutModal } from '../components/UpcomingWorkoutModal';

export const Settings: React.FC = () => {
    const {
        equipment,
        updateEquipment,
        excludedExercises,
        restoreExercise,
        favorites,
        toggleFavorite,
        customExercises,
        addCustomExercise,
        deleteCustomExercise,
        connectionStatus,
        lastSyncTime,
        connectionError
    } = useWorkout();

    const [activeTab, setActiveTab] = useState<'equipment' | 'favorites' | 'custom'>('equipment');
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);

    // Custom Exercise Form State
    const [newExercise, setNewExercise] = useState({
        name: '',
        muscleGroup: 'Chest',
        equipment: 'Bodyweight'
    });

    const handleAddCustom = () => {
        if (!newExercise.name) return;

        const ex: any = {
            id: `custom-${Date.now()}`,
            name: newExercise.name,
            muscleGroup: newExercise.muscleGroup,
            equipment: newExercise.equipment,
            type: 'Isolation', // Default
            isCustom: true // Helper flag
        };

        addCustomExercise(ex);
        setNewExercise({ ...newExercise, name: '' });
    };

    const EQUIPMENT_OPTIONS = [
        'Bodyweight', 'Dumbbells', 'Barbell', 'Cables', 'Machine', 'Kettlebell', 'Bands'
    ];

    return (
        <div className="max-w-xl mx-auto pb-24 space-y-6">
            <UpcomingWorkoutModal isOpen={showUpcomingModal} onClose={() => setShowUpcomingModal(false)} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Settings</h1>

                {/* Sync Status Badge */}
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="text-xs text-slate-400 font-medium">
                        {connectionStatus === 'connected' ? 'Synced' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Link to="/reports" className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-800/80 transition-colors group text-center">
                    <History className="text-emerald-400 group-hover:scale-110 transition-transform" size={24} />
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

                {/* EQUIPMENT TAB */}
                {activeTab === 'equipment' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Main Equipment</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {EQUIPMENT_OPTIONS.map(eq => (
                                    <button
                                        key={eq}
                                        onClick={() => updateEquipment(eq)}
                                        className={`p-3 rounded-xl border text-left transition-all ${equipment === eq
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-bold'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {eq}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                                Select your primary available equipment. For more complex setups, use the "Customize" button on the workout page.
                            </p>
                        </div>

                        {excludedExercises.length > 0 && (
                            <div className="pt-6 border-t border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Excluded Exercises</h3>
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
                                    <div key={fav} className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg border border-slate-700 group hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                                            <span className="text-slate-200 font-medium text-sm">{fav}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(fav)}
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

                {/* CUSTOM EXERCISES TAB */}
                {activeTab === 'custom' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Create New Exercise</h3>
                            <div className="space-y-3">
                                <div>
                                    <input
                                        type="text"
                                        value={newExercise.name}
                                        onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="Exercise Name (e.g. Diamond Pushups)"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <select
                                            value={newExercise.muscleGroup}
                                            onChange={e => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        >
                                            {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={newExercise.equipment}
                                            onChange={e => setNewExercise({ ...newExercise, equipment: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        >
                                            {EQUIPMENT_OPTIONS.map(eq => (
                                                <option key={eq} value={eq}>{eq}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddCustom}
                                    disabled={!newExercise.name}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg mt-2 flex items-center justify-center gap-2 text-sm transition-colors"
                                >
                                    <Plus size={16} /> Add to Library
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

            <div className="text-center text-xs text-slate-600 font-medium">
                v1.2.0 • Data auto-synced
            </div>
        </div>
    );
};
