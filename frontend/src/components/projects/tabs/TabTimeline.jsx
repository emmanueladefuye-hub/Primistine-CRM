import React from 'react';
import { Circle, User } from 'lucide-react';
import { useCollection } from '../../../hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import Skeleton from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

export default function TabTimeline({ project }) {
    // Live Data
    const { data: events, loading } = useCollection('project_timeline', [
        where('projectId', '==', project.id),
        orderBy('createdAt', 'desc')
    ]);

    if (loading) return <Skeleton count={3} className="h-24 mb-6" />;

    if (events.length === 0) return <EmptyState title="No Activity" description="No timeline events recorded yet." className="py-8" />;

    // Group events by Date
    const groupedEvents = events.reduce((groups, event) => {
        const date = event.createdAt?.toDate ? event.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(event);
        return groups;
    }, {});

    const timelineDays = Object.keys(groupedEvents).map(date => ({
        date,
        events: groupedEvents[date]
    }));

    return (
        <div className="max-w-3xl">
            {timelineDays.map((day, dayIdx) => (
                <div key={dayIdx} className="mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 sticky top-0 bg-white py-2 z-10">{day.date}</h3>
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                        {day.events.map((event, idx) => (
                            <TimelineEvent key={event.id || idx} event={event} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function TimelineEvent({ event }) {
    // Map event types to colors safely
    const typeColor = {
        'success': 'bg-green-500',
        'warning': 'bg-amber-500',
        'primary': 'bg-blue-500',
        'info': 'bg-cyan-500',
        'error': 'bg-red-500'
    }[event.type || 'neutral'] || 'bg-slate-300';

    const timeString = event.createdAt?.toDate
        ? event.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '-';

    return (
        <div className="relative pl-8 group cursor-pointer">
            {/* Dot */}
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${typeColor}`}>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{event.title}</p>
                    <span className="text-xs font-mono text-slate-400 ml-4 whitespace-nowrap">{timeString}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{event.description || event.detail}</p>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 w-fit px-2 py-1 rounded-full">
                    <User size={12} />
                    <span>{event.author || 'System'}</span>
                </div>
            </div>
        </div>
    );
}
