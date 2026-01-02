import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../services/UserService';
import { Lock, Save, Users, AlertTriangle, CheckCircle2, Shield, Plus, X } from 'lucide-react';


export const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useState('');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Create User State
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [creationError, setCreationError] = useState<string | null>(null);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser) {
                console.warn('No active session');
                navigate('/');
                return;
            }

            const role = await UserService.getUserRole(currentUser.id);
            if (role !== 'admin') {
                console.warn('Access Denied: User role is', role);
                alert('Access Denied: You are not an admin.');
                navigate('/'); // Kick non-admins out
                return;
            }
            setIsAdmin(true);
            loadData();
        } catch (e) {
            console.error('Error checking admin status:', e);
            alert('Error verifying admin status.');
            navigate('/');
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load Config
            const config = await UserService.getAppConfig();
            if (config) setApiKey(config.openai_api_key || '');

            // Load Users
            const userList = await UserService.getProfiles();
            if (userList) setProfiles(userList);
        } catch (e) {
            console.error('Failed to load admin data', e);
            setMessage({ text: 'Error loading data. Check console.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveKey = async () => {
        const error = await UserService.updateAppConfig({ openai_api_key: apiKey });
        if (error) {
            setMessage({ text: 'Failed to save key.', type: 'error' });
        } else {
            setMessage({ text: 'System Key Updated Successfully.', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleCreateUser = async () => {
        setCreationError(null); // Clear previous error
        if (!newUserEmail || !newUserPassword) {
            setCreationError('Email and Password are required');
            return;
        }

        try {
            await UserService.createUser(newUserEmail, newUserPassword);
            setMessage({ text: 'User created successfully.', type: 'success' });
            // Reset and reload
            setNewUserEmail('');
            setNewUserPassword('');
            setCreationError(null);
            setIsCreatingUser(false);
            loadData(); // refresh list
        } catch (e: any) {
            console.error('Create User Failed:', e);
            // Display directly in modal
            setCreationError(e.message || 'Failed to create user');
        }
    };

    if (isLoading) return <div className="text-white text-center mt-20">Verifying Admin Access...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-24">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-4">
                <Shield className="text-purple-500" size={32} />
                <h1 className="text-3xl font-bold text-white">Admin Console</h1>
            </div>

            {/* KEY MANAGEMENT */}
            <section className="glass-card p-6 border-purple-500/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-purple-400" />
                    Global AI Configuration
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">OpenAI API Key (System Wide)</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                            />
                            <button
                                onClick={handleSaveKey}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                            >
                                <Save size={18} /> Save
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            This key will be used for ALL users. Users will not see this key in their settings.
                        </p>
                    </div>
                </div>
            </section>

            {/* USER MANAGEMENT */}
            <section className="glass-card p-6 border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-blue-400" />
                        Registered Users ({profiles.length})
                    </h2>
                    <button
                        onClick={() => setIsCreatingUser(!isCreatingUser)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        {isCreatingUser ? <X size={14} /> : <Plus size={14} />}
                        {isCreatingUser ? 'Cancel' : 'Add User'}
                    </button>
                </div>

                {isCreatingUser && (
                    <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">Create New Account</h3>
                        {creationError && (
                            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-200 text-xs font-bold flex items-center gap-2">
                                <AlertTriangle size={12} />
                                {creationError}
                            </div>
                        )}
                        <div className="flex gap-3 flex-wrap sm:flex-nowrap items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <button
                                onClick={handleCreateUser}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs uppercase bg-slate-800 text-slate-300">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">User ID / Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3 rounded-r-lg">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-600">No profiles found.</td>
                                </tr>
                            ) : (
                                profiles.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-white">
                                            {p.email || p.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                                                {p.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Toast Message */}
            {message && (
                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border ${message.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' : 'bg-red-900/90 border-red-500/50 text-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    <p className="font-bold">{message.text}</p>
                </div>
            )}
        </div>
    );
};
