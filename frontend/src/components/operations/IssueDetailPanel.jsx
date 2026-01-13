import React, { useState } from 'react';
import {
    X, Clock, MapPin, Building2, User, Camera, MessageSquare,
    CheckCircle, AlertTriangle, ArrowRight, Smartphone
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SeverityBadge from '../ui/SeverityBadge';
import QuickAssignDropdown from './QuickAssignDropdown';

export default function IssueDetailPanel({ issue, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState('details');
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');

    if (!issue) return null;

    const handleAssign = (assignmentData) => {
        onUpdate(issue.id, {
            assignee: assignmentData.engineer,
            status: 'Assigned',
            activityLog: [
                ...(issue.activityLog || []),
                {
                    type: 'ASSIGNMENT',
                    text: `Assigned to ${assignmentData.engineer.name}`,
                    date: new Date().toISOString(),
                    user: 'Admin'
                }
            ]
        });
        setIsAssignOpen(false);
    };

    const handleStatusChange = (newStatus) => {
        onUpdate(issue.id, {
            status: newStatus,
            activityLog: [
                ...(issue.activityLog || []),
                {
                    type: 'STATUS',
                    text: `Status changed to ${newStatus}`,
                    date: new Date().toISOString(),
                    user: 'Current User'
                }
            ]
        });
        toast.success(`Marked as ${newStatus}`);
    };

    const handleResolve = () => {
        if (!resolutionNotes.trim()) {
            toast.error("Please provide resolution notes.");
            return;
        }
        onUpdate(issue.id, {
            status: 'Resolved',
            resolutionNotes: resolutionNotes,
            activityLog: [
                ...(issue.activityLog || []),
                {
                    type: 'RESOLUTION',
                    text: `Issue resolved: ${resolutionNotes}`,
                    date: new Date().toISOString(),
                    user: 'Current User'
                }
            ]
        });
        toast.success('Issue marked as Resolved');
        setActiveTab('details');
    };

    const handleAddComment = () => {
        if (!comment.trim()) return;
        onUpdate(issue.id, {
            commentsCount: (issue.commentsCount || 0) + 1,
            activityLog: [
                ...(issue.activityLog || []),
                {
                    type: 'COMMENT',
                    text: comment,
                    date: new Date().toISOString(),
                    user: 'Current User'
                }
            ]
        });
        setComment('');
        toast.success('Comment added');
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col">

            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-white z-10">
                <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-slate-400">#{issue.id}</span>
                        <SeverityBadge severity={issue.severity} mini />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">{issue.title}</h2>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex-none px-6 border-b border-slate-100 flex gap-6">
                {['details', 'activity', 'resolution'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "py-3 text-sm font-bold border-b-2 transition-colors capitalize",
                            activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

                {activeTab === 'details' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <MapPin size={12} /> Location
                                </h4>
                                <p className="text-sm font-medium text-slate-800">{issue.location}</p>
                                {issue.projectContext && <p className="text-xs text-slate-500 mt-1">{issue.projectContext}</p>}
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <User size={12} /> Reported By
                                </h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        {issue.reporter.name.charAt(0)}
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 truncate">{issue.reporter.name}</p>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{issue.timeAgo}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Description</h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{issue.description || "No description provided."}</p>
                        </div>

                        {/* Photos */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <Camera size={14} /> Attached Photos ({issue.photosCount || 0})
                            </h4>
                            {issue.hasPhotos ? (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex-none flex items-center justify-center text-xs text-slate-400">Photo 1</div>
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex-none flex items-center justify-center text-xs text-slate-400">Photo 2</div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic">No photos attached.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                            {/* Mock Timeline Items */}
                            <div className="relative pl-6">
                                <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white"></div>
                                <p className="text-xs text-slate-400 mb-1">{issue.timeAgo}</p>
                                <p className="text-sm text-slate-700">Issue reported by <span className="font-bold">{issue.reporter.name}</span></p>
                            </div>

                            {issue.activityLog?.map((log, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                    <p className="text-xs text-slate-400 mb-1">Just now</p>
                                    <div className="text-sm text-slate-700">
                                        {log.type === 'COMMENT' ? (
                                            <div className="bg-white p-3 rounded-lg border border-slate-200 mt-1 shadow-sm">
                                                <p>{log.text}</p>
                                            </div>
                                        ) : (
                                            <p>{log.text}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <div className="mt-8 pt-4 border-t border-slate-200">
                            <div className="flex gap-3">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add an internal note..."
                                    className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                    rows={2}
                                />
                                <button
                                    onClick={handleAddComment}
                                    className="px-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'resolution' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <AlertTriangle className="text-blue-600 flex-none" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-blue-900 mb-1">Resolution Requirements</h4>
                                <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                                    <li>Provide clear notes on what was fixed.</li>
                                    <li>Upload at least one verification photo.</li>
                                    <li>Record time spent on the fix.</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Resolution Notes</label>
                            <textarea
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                                rows={4}
                                placeholder="Describe the fix..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleResolve}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-[0.98]"
                        >
                            Mark as Resolved
                        </button>
                    </div>
                )}
            </div>

            {/* Sticky Action Footer */}
            <div className="flex-none p-4 bg-white border-t border-slate-200 flex gap-3 z-10">
                <div className="relative">
                    <button
                        onClick={() => setIsAssignOpen(!isAssignOpen)}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <User size={18} />
                        {issue.assignee ? 'Reassign' : 'Assign'}
                    </button>
                    {isAssignOpen && <QuickAssignDropdown issue={issue} onAssign={handleAssign} onClose={() => setIsAssignOpen(false)} />}
                </div>

                {issue.status !== 'Resolved' && (
                    <button
                        onClick={() => handleStatusChange('In Progress')}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
                    >
                        Start Work
                    </button>
                )}
            </div>
        </div>
    );
}
