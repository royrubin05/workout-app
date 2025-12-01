import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Save, Dumbbell, History } from 'lucide-react';
import { getAllExercises } from '../data/exercises';

export const Settings: React.FC = () => {
    const { equipment, updateEquipment, history } = useWorkout();
    const [input, setInput] = useState(equipment);
    const [previewCount, setPreviewCount] = useState(0);

    useEffect(() => {
        setInput(equipment);
    }, [equipment]);

    useEffect(() => {
        // Calculate preview of available exercises
        const userEq = input.toLowerCase().split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        if (!userEq.includes('bodyweight')) userEq.push('bodyweight');

        const count = getAllExercises().filter(ex => {
            const requirements = ex.equipment.toLowerCase().split(',').map(r => r.trim());
            return requirements.every(r => userEq.some(u => u.includes(r) || r.includes(u)));
        }).length;

        setPreviewCount(count);
    }, [input]);

    const handleSave = () => {
        updateEquipment(input);
        // Visual feedback could be added here
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 text-center">
                    <Dumbbell className="mx-auto text-blue-400 mb-2" size={24} />
                    <div className="text-2xl font-bold">{previewCount}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Available Exercises</div>
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
        </div>
    );
};
