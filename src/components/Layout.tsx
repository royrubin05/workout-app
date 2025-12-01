import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Settings } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen pb-20">
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        FitGen
                    </h1>
                </div>
            </header>

            <main className="pt-24 px-6 max-w-2xl mx-auto">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 pb-safe">
                <div className="max-w-2xl mx-auto flex justify-around items-center">
                    <Link
                        to="/"
                        className={`p-4 flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Dumbbell size={24} />
                        <span className="text-xs font-medium">Workout</span>
                    </Link>

                    <Link
                        to="/settings"
                        className={`p-4 flex flex-col items-center gap-1 transition-colors ${location.pathname === '/settings' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Settings size={24} />
                        <span className="text-xs font-medium">Settings</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
};
