import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Activity, Server, Zap, AlertCircle, CheckCircle2, RefreshCw, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AutomationActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, error, automation

    useEffect(() => {
        // Query last 50 logs
        const q = query(
            collection(db, 'logs'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Safety check for timestamp
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            setLogs(fetchedLogs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'error') return log.level === 'error' || log.action?.includes('ERROR');
        if (filter === 'automation') return log.metadata?.source === 'n8n' || log.action?.includes('AUTOMATION');
        return true;
    });

    const getIcon = (log) => {
        if (log.level === 'error' || log.action?.includes('ERROR')) return <AlertCircle size={18} className="text-red-500" />;
        if (log.metadata?.source === 'n8n' || log.action?.includes('AUTOMATION')) return <Zap size={18} className="text-premium-gold-500" />;
        return <CheckCircle2 size={18} className="text-emerald-500" />;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-premium-blue-900 flex items-center gap-3">
                        <Server className="text-slate-400" /> System & Automation Logs
                    </h1>
                    <p className="text-slate-500 font-medium">Real-time visibility into background processes and n8n workflows.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                    {['all', 'automation', 'error'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filter === f
                                    ? 'bg-premium-blue-900 text-white shadow-lg'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Automation Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} className="text-premium-gold-500" />
                    </div>
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Active Workflows</h3>
                    <div className="text-3xl font-black text-premium-blue-900">12</div>
                    <div className="flex items-center gap-2 mt-2 text-emerald-600 text-xs font-bold">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        n8n Engine Online
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">24h Events</h3>
                    <div className="text-3xl font-black text-premium-blue-900">{logs.length}</div>
                    <p className="text-slate-400 text-xs mt-2">Recorded system activities</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">System Health</h3>
                    <div className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                        <CheckCircle2 /> Operational
                    </div>
                    <p className="text-slate-400 text-xs mt-2">No critical service outages</p>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-premium-blue-900 flex items-center gap-2">
                        <Activity size={18} /> Activity Stream
                    </h3>
                    {loading && <RefreshCw size={18} className="animate-spin text-slate-400" />}
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No logs found for this filter.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                <div className={`p-2 rounded-xl shrink-0 ${log.level === 'error' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {getIcon(log)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-700 text-sm truncate pr-4">{log.action}</h4>
                                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                            {format(log.timestamp, 'MMM d, HH:mm:ss')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{log.message}</p>
                                    {log.metadata && (
                                        <div className="flex gap-2 mt-2">
                                            {Object.entries(log.metadata).map(([key, value]) => (
                                                <span key={key} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono text-slate-500 border border-slate-200">
                                                    {key}: {String(value)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
