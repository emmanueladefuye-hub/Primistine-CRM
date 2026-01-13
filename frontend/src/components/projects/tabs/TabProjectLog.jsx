import React, { useState, useMemo, useEffect } from 'react';
import {
    Send,
    MessageSquare,
    Calendar,
    User,
    Tag,
    MoreVertical,
    FileText,
    Activity,
    CheckCircle2,
    Clock,
    ClipboardList
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCollection } from '../../../hooks/useFirestore';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import Skeleton from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';
import clsx from 'clsx';

export default function TabProjectLog({ project }) {
    const { currentUser } = useAuth();
    const [entry, setEntry] = useState('');
    const [type, setType] = useState('General');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Live Feed of Logs - Using simple where query to avoid index requirements
    const { data: rawLogs, loading, error: fetchError } = useCollection('project_logs', [
        where('projectId', '==', project.id || '')
    ]);

    // Debugging
    useEffect(() => {
        if (fetchError) {
            console.error("Project Log Fetch Error:", fetchError);
        }
    }, [fetchError]);

    // Derived State: Sorted Logs
    const sortedLogs = useMemo(() => {
        if (!rawLogs) return [];
        return [...rawLogs].sort((a, b) => {
            const timeA = a.timestamp?.seconds || a.timestamp?.toMillis?.() / 1000 || 0;
            const timeB = b.timestamp?.seconds || b.timestamp?.toMillis?.() / 1000 || 0;
            return timeB - timeA;
        });
    }, [rawLogs]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const content = entry.trim();
        if (!content || isSubmitting) return;



        setIsSubmitting(true);
        try {
            const docRef = await addDoc(collection(db, 'project_logs'), {
                projectId: project.id,
                content: content,
                type: type,
                authorId: currentUser?.uid || 'unknown',
                authorName: currentUser?.displayName || 'Site Engineer',
                authorEmail: currentUser?.email || '',
                timestamp: serverTimestamp()
            });


            setEntry('');
            toast.success('Project log synchronized to cloud');
        } catch (err) {
            console.error("Log Submission Failed:", err);
            toast.error(`Failed to sync: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Milestone': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Observation': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Issue': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Milestone': return CheckCircle2;
            case 'Observation': return Activity;
            case 'Issue': return Tag;
            default: return FileText;
        }
    };

    if (loading) return <div className="p-8"><Skeleton count={3} /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* 1. Add Log Entry Form */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm transition-all hover:shadow-xl group">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 transition-transform group-hover:rotate-6">
                        <MessageSquare size={22} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Post Site Update</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">New project record</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block pl-1">Select Update Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['General', 'Milestone', 'Observation', 'Issue'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={clsx(
                                        "px-4 py-4 rounded-2xl text-sm font-black transition-all border-2",
                                        type === t
                                            ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]"
                                            : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group/textarea">
                        <textarea
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                            onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Describe site activities, record findings, or log project milestones..."
                            className="w-full min-h-[160px] p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white focus:ring-[12px] focus:ring-blue-500/5 outline-none transition-all text-slate-700 font-medium leading-relaxed resize-none text-lg"
                        />
                        <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-focus-within/textarea:opacity-100 transition-opacity">
                            Press Ctrl + Enter to sync
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !entry.trim()}
                            className={clsx(
                                "relative overflow-hidden px-12 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 active:scale-95 shadow-2xl group/btn",
                                isSubmitting || !entry.trim()
                                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-blue-500/30 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                            )}
                        >
                            {/* Animated Background Pulse */}
                            {!isSubmitting && entry.trim() && (
                                <span className="absolute inset-0 bg-white/20 animate-pulse opacity-0 group-hover/btn:opacity-100 transition-opacity"></span>
                            )}

                            <div className="relative flex items-center gap-3">
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span className="animate-pulse">Syncing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sync to Cloud</span>
                                        <Send size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Log History Feed */}
            <div className="space-y-1 relative before:absolute before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100/80">
                <div className="flex items-center justify-between mb-10 pl-16">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Project Timeline</h3>
                        <p className="text-sm font-bold text-slate-400">Chronological site records</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest">
                        {sortedLogs.length} Logged
                    </div>
                </div>

                {fetchError ? (
                    <div className="pl-16 py-12 text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-100">
                        Error loading logs: {fetchError}
                    </div>
                ) : sortedLogs.length === 0 ? (
                    <div className="pl-16 py-12">
                        <EmptyState
                            icon={ClipboardList}
                            title="The Log is Clean"
                            description="No activity has been recorded yet. Every post you make becomes a permanent part of the project's digital history."
                        />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedLogs.map((log) => {
                            const Icon = getTypeIcon(log.type);
                            const date = log.timestamp?.toDate ? log.timestamp.toDate() :
                                log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000) :
                                    new Date();

                            return (
                                <div key={log.id} className="relative group pl-16 animate-in fade-in slide-in-from-left-4 duration-500">
                                    {/* Timeline Connector Dot */}
                                    <div className={clsx(
                                        "absolute left-[1.625rem] top-8 w-3.5 h-3.5 rounded-full border-[3px] border-white ring-8 ring-white z-10 transition-all group-hover:scale-125 shadow-sm",
                                        log.type === 'Issue' ? "bg-rose-500" :
                                            log.type === 'Milestone' ? "bg-emerald-500" :
                                                "bg-blue-500"
                                    )}></div>

                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1 relative">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                            <div className="flex items-center gap-5">
                                                <div className={clsx(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm",
                                                    getTypeColor(log.type).split(' ')[0]
                                                )}>
                                                    <Icon size={28} className={getTypeColor(log.type).split(' ')[1]} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <span className="font-black text-slate-800 text-lg tracking-tight">{log.authorName}</span>
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                                            getTypeColor(log.type)
                                                        )}>
                                                            {log.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={14} className="text-slate-300" />
                                                            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={14} className="text-slate-300" />
                                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end md:self-auto">
                                                <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-slate-600 font-medium leading-[1.8] text-lg whitespace-pre-wrap pl-1">
                                            {log.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
