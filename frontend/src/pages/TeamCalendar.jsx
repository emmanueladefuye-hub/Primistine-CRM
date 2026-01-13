import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Plus, Loader2 } from 'lucide-react';
import { useTeams } from '../contexts/TeamsContext';
import { useCollection } from '../hooks/useFirestore';
import clsx from 'clsx';

export default function TeamCalendar() {
    const { teamMembers, loading: teamsLoading } = useTeams();
    const { data: visits, loading: visitsLoading } = useCollection('visits');
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    // Calculate dates for current week display
    const weekDays = useMemo(() => {
        const days = [];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (currentWeekOffset * 7)); // Monday start

        for (let i = 0; i < 5; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                iso: date.toISOString().split('T')[0]
            });
        }
        return days;
    }, [currentWeekOffset]);

    const activeEngineers = teamMembers?.filter(m => m.status === 'Active') || [];
    const loading = teamsLoading || visitsLoading;

    const getVisitForDayAndEngineer = (dayIso, engineerId) => {
        return visits?.find(v => v.date === dayIso && v.engineerId === engineerId);
    };

    const weekRangeLabel = `${weekDays[0].label} - ${weekDays[4].label}, 2026`;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900">Team Schedule</h1>
                    <p className="text-slate-500">Manage field assignments and availability.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                        <button
                            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                            className="p-1 hover:bg-slate-100 rounded"
                        >
                            <ChevronLeft size={20} className="text-slate-500" />
                        </button>
                        <span className="px-4 font-bold text-slate-700 w-44 text-center">{weekRangeLabel}</span>
                        <button
                            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                            className="p-1 hover:bg-slate-100 rounded"
                        >
                            <ChevronRight size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                    <div className="p-4 border-r border-slate-200 font-bold text-slate-400 text-xs uppercase text-center flex items-center justify-center">
                        Engineer
                    </div>
                    {weekDays.map(day => (
                        <div key={day.iso} className="p-4 border-r border-slate-200 last:border-r-0 text-center">
                            <div className="font-bold text-slate-700">{day.name}</div>
                            <div className="text-xs text-slate-400">{day.label}</div>
                        </div>
                    ))}
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Loading Schedule...</span>
                        </div>
                    ) : activeEngineers.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-slate-400 italic">
                            No active team members found.
                        </div>
                    ) : (
                        activeEngineers.map(eng => (
                            <div key={eng.id} className="grid grid-cols-6 border-b border-slate-100 min-h-[140px]">
                                <div className="p-4 border-r border-slate-100 flex flex-col items-center justify-center bg-slate-50/30">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 mb-2 border-2 border-white shadow-sm overflow-hidden">
                                        {eng.avatar ? <img src={eng.avatar} alt="" className="w-full h-full object-cover" /> : eng.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 text-center leading-tight">{eng.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{eng.role}</span>
                                </div>

                                {weekDays.map(day => {
                                    const visit = getVisitForDayAndEngineer(day.iso, eng.id);
                                    return (
                                        <div key={day.iso} className="p-2 border-r border-slate-100 last:border-r-0 relative group">
                                            <div className="w-full h-full rounded-lg hover:bg-slate-50/50 transition-colors border-2 border-transparent flex items-center justify-center">
                                                {!visit && <Plus size={16} className="text-slate-200 opacity-0 group-hover:opacity-100" />}
                                                {visit && (
                                                    <div className={clsx(
                                                        "w-full mx-0.5 p-3 rounded-[1.25rem] border text-left shadow-sm hover:shadow-md transition-all",
                                                        visit.type === 'Installation' ? "bg-orange-50 border-orange-100 text-orange-700" :
                                                            visit.type === 'Site Survey' ? "bg-blue-50 border-blue-100 text-blue-700" :
                                                                "bg-emerald-50 border-emerald-100 text-emerald-700"
                                                    )}>
                                                        <div className="text-[10px] font-black opacity-70 mb-1 flex items-center gap-1">
                                                            <Clock size={10} /> {visit.time}
                                                        </div>
                                                        <div className="font-black text-xs leading-tight mb-2 line-clamp-2">{visit.title}</div>
                                                        <div className="text-[10px] font-bold opacity-60 truncate">
                                                            📍 {visit.location}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
