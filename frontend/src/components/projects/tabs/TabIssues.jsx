import React from 'react';
import { AlertCircle, Clock, MapPin, ChevronRight, User } from 'lucide-react';
import clsx from 'clsx';
import { useCollection } from '../../../hooks/useFirestore';
import { where } from 'firebase/firestore';
import EmptyState from '../../ui/EmptyState';
import Skeleton from '../../ui/Skeleton';

export default function TabIssues({ project }) {
    // Live Data
    const { data: issues, loading } = useCollection('project_issues', [
        where('projectId', '==', project.id)
    ]);

    if (loading) return <Skeleton count={3} className="h-24" />;

    if (issues.length === 0) {
        return <EmptyState title="No Issues Reported" description="Great job! This project has no active operational issues." icon={AlertCircle} className="py-8" />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700">Open Issues ({issues.length})</h3>
                {/* Ensure the parent triggers the modal, this button is just a visual prompt or we can wire it too */}
                <button className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                    View All Issues <ChevronRight size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {issues.map(issue => (
                    <IssueRow key={issue.id} issue={issue} />
                ))}
            </div>
        </div>
    );
}

function IssueRow({ issue }) {
    const severityColors = {
        CRITICAL: 'bg-red-100 text-red-700 border-red-200',
        HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
        MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const statusColors = {
        OPEN: 'bg-red-50 text-red-700',
        IN_PROGRESS: 'bg-blue-50 text-blue-700',
        RESOLVED: 'bg-green-50 text-green-700',
        WAITING_FOR_REVIEW: 'bg-amber-50 text-amber-700',
    };

    // Helper for relative time
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
                <div className={clsx("w-3 h-3 rounded-full", severityColors[issue.severity].split(' ')[1].replace('text', 'bg'))}></div>

                <div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{issue.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className={clsx("px-2 py-0.5 rounded font-bold text-[10px]", severityColors[issue.severity])}>{issue.severity}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {issue.reporter.name}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(issue.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className={clsx("px-2 py-1 rounded-md text-xs font-bold uppercase", statusColors[issue.status])}>
                    {issue.status.replace(/_/g, ' ')}
                </span>
                <div className="p-2 text-slate-300 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors">
                    <ChevronRight size={20} />
                </div>
            </div>
        </div>
    )
}
