import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../services/UserService';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const isLogin = true;
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await UserService.signIn(email, password);
            } else {
                await UserService.signUp(email, password);
            }
            // Redirect to home on success. 
            // Context will pick up the session automatically.
            navigate('/');
        } catch (err: any) {
            console.error('Auth Error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Branding */}
                <div className="text-center space-y-2">
                    <div className="mb-4">
                        <img
                            src="/pwa-192x192.png"
                            alt="Rubinia Ripped Logo"
                            className="w-16 h-16 shadow-xl shadow-purple-500/20"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Rubinia Ripped</h1>
                    <p className="text-slate-400">Your AI-Powered Personal Coach</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 border-slate-800 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {isLogin ? 'Enter your credentials to continue' : 'Start your fitness journey today'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
};
