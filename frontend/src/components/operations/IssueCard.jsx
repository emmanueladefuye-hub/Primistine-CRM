import React from 'react';
import clsx from 'clsx';
import { Clock, User, MapPin, MessageSquare, Briefcase } from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';

export default function IssueCard({ issue, onClick, isSelected, compact = false }) {
    return (
        <div
            onClick={() => onClick(issue)}
            className={clsx(
                "group relative p-4 border-b border-gray-100 hover:bg-slate-50 transition-all cursor-pointer",
                isSelected ? "bg-blue-50/50 border-l-4 border-l-blue-500" : "bg-white border-l-4 border-l-transparent",
                "hover:shadow-md"
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">#{issue.id}</span>
                    <SeverityBadge severity={issue.severity} />
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    <span>{issue.timeAgo}</span>
                </div>
            </div>

            <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {issue.title}
            </h3>

            {!compact && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {issue.description}
                </p>
            )}

            <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="truncate max-w-[180px]">{issue.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User size={12} className="text-slate-400" />
                    <span>{issue.reporter.name}</span>
                    <span className="text-slate-300">•</span>
                    <Briefcase size={12} className="text-slate-400" />
                    <span className="truncate max-w-[100px]">{issue.projectContext}</span>
                </div>
            </div>

            {/* Action Footer */}
            <div className={clsx(
                "mt-3 flex items-center justify-between pt-2 border-t border-slate-100",
                compact ? "hidden" : "flex"
            )}>
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        issue.status === 'Open' ? "bg-slate-100 text-slate-600" :
                            issue.status === 'Assigned' ? "bg-blue-100 text-blue-600" :
                                issue.status === 'In Progress' ? "bg-purple-100 text-purple-600" :
                                    issue.status === 'Resolved' ? "bg-green-100 text-green-600" :
                                        "bg-gray-100 text-gray-500"
                    )}>
                        {issue.status}
                    </span>
                    {issue.comments > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <MessageSquare size={12} /> {issue.comments}
                        </div>
                    )}
                </div>
                {issue.hasPhotos && (
                    <div className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                        📷 Photos
                    </div>
                )}
            </div>

            {/* Hover slide-in actions (Desktop mainly) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex flex-col gap-1">
                {/* Placeholder for quick actions if needed */}
            </div>
        </div>
    );
}
