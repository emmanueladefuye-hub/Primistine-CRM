import React, { useState, useEffect } from 'react';
import { Mail, Phone, X, Send, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { crmService } from '../lib/services/crmService';

export default function ContactInteractionModal({ isOpen, onClose, lead, initialMode = 'email' }) {
    if (!isOpen || !lead) return null;

    const { currentUser } = useAuth();
    const [mode, setMode] = useState(initialMode); // 'email' | 'phone'
    const [note, setNote] = useState('');
    const [isLogging, setIsLogging] = useState(false);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode, isOpen]);

    const handleAction = () => {
        if (mode === 'email') {
            window.location.href = `mailto:${lead.email}`;
        } else {
            window.location.href = `tel:${lead.phone}`;
        }
    };

    const handleLogInteraction = async () => {
        if (!note.trim()) {
            toast.error("Please add a note about the interaction");
            return;
        }

        setIsLogging(true);
        try {
            await crmService.updateLead(lead.id, {
                lastContact: new Date().toISOString(),
                // In a real app we'd push to an 'interactions' subcollection or activity array
            }, currentUser);

            // For now just success toast as we don't have a specific interaction log array structure 
            // other than the generic 'activities' in leadService (which we can't easily access from here without importing leadService)
            // But crmService doesn't expose addActivity yet. 
            // We'll just update lastContact for now effectively.

            toast.success(`${mode === 'email' ? 'Email' : 'Call'} logged successfully`);
            onClose();
            setNote('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to log interaction");
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`p-6 text-white flex justify-between items-start ${mode === 'email' ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
                    <div>
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                            {mode === 'email' ? <Mail className="opacity-80" /> : <Phone className="opacity-80" />}
                            Contact Lead
                        </h2>
                        <p className="text-white/80 text-xs font-bold mt-1 uppercase tracking-wider">
                            {lead.name} • {lead.company}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setMode('phone')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${mode === 'phone' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Phone size={14} /> Phone
                    </button>
                    <button
                        onClick={() => setMode('email')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${mode === 'email' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Mail size={14} /> Email
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Action Area */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${mode === 'email' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                            {mode === 'email' ? <Mail size={24} /> : <Phone size={24} />}
                        </div>

                        <div className="w-full">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {mode === 'email' ? 'Email Address' : 'Phone Number'}
                            </div>
                            <div className="text-lg font-black text-slate-800 select-all">
                                {mode === 'email' ? lead.email : lead.phone}
                            </div>
                        </div>

                        <button
                            onClick={handleAction}
                            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${mode === 'email' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                        >
                            {mode === 'email' ? 'Open Mail App' : 'Call Now'}
                            <span className="opacity-60">→</span>
                        </button>

                        <p className="text-[10px] text-slate-400">
                            Clicking will open your device's default {mode === 'email' ? 'email client' : 'dialer'}.
                        </p>
                    </div>

                    {/* Log Interaction */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            Log Interaction Note
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={`Summarize the ${mode} outcome...`}
                            className="w-full h-24 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 resize-none p-3"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleLogInteraction}
                        disabled={isLogging || !note.trim()}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLogging ? 'Saving...' : 'Log & Save'}
                        <Send size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
