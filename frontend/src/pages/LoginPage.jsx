import React, { useState } from 'react';
import { ArrowRight, Lock, AlertCircle, User, Mail } from 'lucide-react'; // Added icons
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { seedDatabase } from '../lib/seeder';

export default function LoginPage() {
    const { login, signup } = useAuth();
    const [isLogin, setIsLogin] = useState(true); // Toggle state

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // New field for signup

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/executive';

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            setError(`Failed to ${isLogin ? 'sign in' : 'create account'}. ` + err.message);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-premium-blue-900 to-slate-50 z-0"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-premium-gold-500/10 rounded-full blur-3xl z-0"></div>
            <div className="absolute top-40 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl z-0"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-12 h-12 bg-premium-blue-900 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg border border-premium-gold-500/30">
                            P
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-premium-blue-900">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-slate-500 text-sm">
                            {isLogin ? 'Sign in to Primistine Electric CRM' : 'Join the Primistine Team'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-premium-blue-500 focus:border-transparent outline-none transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="name@primistine.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-premium-blue-500 focus:border-transparent outline-none transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-premium-blue-500 focus:border-transparent outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-300 text-premium-blue-600 focus:ring-premium-blue-500" />
                                    <span className="text-slate-600">Remember me</span>
                                </label>
                                <a href="#" className="text-premium-blue-600 hover:text-premium-blue-800 font-medium">Forgot Password?</a>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-premium-blue-900 hover:bg-premium-blue-800 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-premium-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                        >
                            <Lock size={18} /> {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-premium-blue-600 font-bold hover:underline"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-400">
                        &copy; 2026 Primistine Electric Ltd. All rights reserved.
                    </div>
                </div>

                {/* Dev Tool: Seed Database */}
                <div className="mt-4 flex justify-center opacity-20 hover:opacity-100 transition-opacity">
                    <button
                        onClick={async () => {
                            if (window.confirm('Reset/Seed Database?')) {
                                try {
                                    await seedDatabase();
                                    alert('Database Seeded!');
                                } catch (e) {
                                    alert('Error: ' + e.message);
                                }
                            }
                        }}
                        className="text-xs text-white bg-slate-800 px-3 py-1 rounded"
                    >
                        [DEV] Seed Database
                    </button>
                </div>
            </div>
        </div>
    );
}
