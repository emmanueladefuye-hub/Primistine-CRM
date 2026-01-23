import React from 'react';
import {
    FileText,
    CheckCircle2,
    Phone,
    Clock,
    MessageSquare,
    Calendar,
    Users,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';

const ACTIVITY_ICONS = {
    note: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Note' },
    status: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Stage Change' },
    call: { icon: Phone, color: 'text-green-600', bg: 'bg-green-100', label: 'Call' },
    meeting: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Meeting' },
    email: { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Email' },
    deal: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Deal Update' },
    default: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Activity' }
};

const ActivityTimeline = ({ activities = [] }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <Clock size={48} className="text-slate-300 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No activity intelligence yet</p>
            </div>
        );
    }

    // Sort activities by date decending
    const sortedActivities = [...activities].sort((a, b) => {
        return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp);
    });

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {sortedActivities.map((activity, index) => {
                const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
                const Icon = config.icon;

                return (
                    <div key={activity.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Icon size={16} className={clsx(config.color)} />
                        </div>

                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-surface p-5 rounded-[24px] border border-white/20 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between space-x-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg", config.bg, config.color)}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs font-black text-premium-blue-900">{activity.user || 'System'}</span>
                                </div>
                                <time className="text-[10px] font-bold text-slate-400 font-display uppercase tracking-widest">{activity.date}</time>
                            </div>
                            <div className="text-sm text-slate-600 leading-relaxed font-medium">
                                {activity.text}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityTimeline;
