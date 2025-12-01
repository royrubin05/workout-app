import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Check your email for the login link!');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <div className="glass-card p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In / Sign Up</h2>
                <p className="text-slate-400 mb-6 text-center">
                    Enter your email to save your workout history and equipment settings to the cloud.
                </p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Your email"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Sending link...' : 'Send Magic Link'}
                    </button>
                </form>
                {message && (
                    <div className="mt-4 p-3 bg-blue-500/20 text-blue-300 rounded-lg text-center text-sm">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};
