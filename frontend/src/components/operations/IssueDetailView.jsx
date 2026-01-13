import React, { useEffect, useState } from 'react';
import {
    ArrowLeft, Clock, MapPin, AlertTriangle, MessageSquare,
    CheckCircle, XCircle, MoreHorizontal, User, Calendar,
    Paperclip, Send, Settings, AlertCircle, Phone
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import SeverityBadge from '../ui/SeverityBadge';
import clsx from 'clsx';
import { getIssueById, updateIssueStatus } from '../../services/issues';

/**
 * Full Page Detail View for an Issue
 * Spec: Two-column layout with header. Photos, Description, Timeline, Comments, Action Panel.
 */
export default function IssueDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadIssue = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getIssueById(id);
                setIssue(data);
            } catch (err) {
                console.error("Failed to load issue", err);
            } finally {
                setLoading(false);
            }
        }
        loadIssue();
    }, [id]);

    const handleBack = () => navigate('/operations/issues');

    const handleStatusUpdate = async (newStatus) => {
        if (!issue) return;
        try {
            await updateIssueStatus(issue.id, newStatus, { name: 'Demo User' });
            setIssue(prev => ({ ...prev, status: newStatus }));
        } catch (e) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center">Loading...</div>;
    if (!issue) return <div className="h-full flex items-center justify-center">Issue not found</div>;


    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-y-auto">

            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-3"
                >
                    <ArrowLeft size={16} /> Back to Issues
                </button>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-slate-400">#{issue.id}</span>
                            <SeverityBadge severity={issue.severity} />
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={12} /> Reported {issue.reportedAt}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">{issue.title}</h1>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                {issue.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">SLA Timer:</span>
                            <span className="text-red-500 font-mono font-bold">{issue.slaRemaining} remaining</span>
                        </div>
                        {/* Mock Progress Bar */}
                        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[82%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT 2-COL */}
            <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN (60-65%) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* PHOTOS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            📸 Photos (3)
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="aspect-square bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors">
                                    <span className="text-xs">Photo {i}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-bold text-slate-800">📝 Issue Description</h3>
                            <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                Reported by <span className="font-medium text-slate-700">{issue.reporter.name}</span>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-slate-600 mb-6 whitespace-pre-line">
                            {issue.description}
                        </div>

                        {issue.severity === 'Critical' && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex gap-3 text-red-800 text-sm">
                                <AlertTriangle size={20} className="shrink-0" />
                                <div>
                                    <span className="font-bold block mb-1">Safety Note</span>
                                    {issue.safetyNote}
                                </div>
                            </div>
                        )}

                        {/* Technical Details Collapsible (Mock) */}
                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <div className="flex items-center justify-between text-sm font-medium text-slate-700 cursor-pointer">
                                <span>🔧 Technical Details</span>
                                <span className="text-slate-400 text-xs">▼</span>
                            </div>
                        </div>
                    </div>

                    {/* TIMELINE */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-6">📜 Activity Timeline</h3>
                        <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">

                            <TimelineItem
                                color="blue"
                                icon={CheckCircle}
                                time="2:30 PM"
                                title="Work In Progress"
                                desc="Amaka arrived on site with replacement inverter."
                                attachment="Invoice #INV-8833.pdf"
                            />
                            <TimelineItem
                                color="blue"
                                icon={User}
                                time="2:15 PM"
                                title="Assigned to Amaka Nwosu"
                                desc="Manager assigned senior engineer."
                            />
                            <TimelineItem
                                color="red"
                                icon={AlertTriangle}
                                time="2:00 PM"
                                title="Issue Reported"
                                desc={`Chidi Okafor reported via mobile. Location: ${issue.location}`}
                            />
                        </div>
                    </div>

                    {/* COMMENTS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-6">💬 Team Discussion</h3>
                        {/* Mock Comments */}
                        <div className="space-y-4 mb-6">
                            <Comment
                                user="Amaka Nwosu"
                                time="2:35 PM"
                                text="On my way with replacement unit. ETA 15 minutes. Chidi, please reassure client this is warranty replacement - no cost to them."
                                likes={2}
                            />
                        </div>
                        {/* Input */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                            <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-2">
                                <textarea rows={2} className="w-full bg-transparent text-sm resize-none outline-none" placeholder="Add a comment... @mention team"></textarea>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                                    <div className="flex gap-2 text-slate-400">
                                        <button className="hover:text-slate-600"><span className="text-xs">📎</span></button>
                                        <button className="hover:text-slate-600"><span className="text-xs">😊</span></button>
                                    </div>
                                    <button className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">Send</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleStatusUpdate('Resolved')}
                                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle size={18} /> Mark as Resolved
                            </button>
                            <button className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                <User size={18} /> Re-assign Issue
                            </button>
                            <button className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                <MessageSquare size={18} /> Internal Note
                            </button>
                        </div>
                    </div>

                    {/* ASSIGNED TO */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">👤 Assigned To</h4>
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">AN</div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{issue.assignee.name}</p>
                                <p className="text-xs text-slate-500">{issue.assignee.role}</p>
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 font-medium">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    {issue.assignee.status}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 space-y-2 mb-4 bg-slate-50 p-3 rounded-lg">
                            <div className="flex justify-between">
                                <span>Assigned:</span>
                                <span className="font-medium">{issue.assignee.assignedAt}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Avg Response:</span>
                                <span className="font-medium text-green-600">15 mins ✓</span>
                            </div>
                        </div>
                        <button className="w-full text-xs text-slate-400 hover:text-blue-600 font-medium text-center">Reassign to someone else</button>
                    </div>

                    {/* PROJECT CONTEXT */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">🏗️ Project Context</h4>
                        <div className="text-sm space-y-3">
                            <div>
                                <span className="block text-xs text-slate-400">Project</span>
                                <span className="font-medium text-blue-600 hover:underline cursor-pointer">{issue.project}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400">Client</span>
                                <span className="font-medium text-slate-700">Mr. & Mrs. Johnson</span>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400">Phase</span>
                                <span className="font-medium text-slate-700">Installation (Day 3 of 5)</span>
                            </div>
                        </div>
                    </div>

                    {/* SIMILAR ISSUES (AI) */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-5">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-1">
                            ✨ Similar Issues (AI)
                        </h4>
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
                                <div className="text-xs font-bold text-slate-700 mb-1">Inverter overheating</div>
                                <div className="text-[10px] text-slate-500">3 months ago • Resolved by Fan Replacement</div>
                            </div>
                            <div className="text-xs text-indigo-700 bg-indigo-100/50 p-2 rounded">
                                💡 <strong>Suggestion:</strong> Check ventilation and fan operation first before replacing entire unit.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function TimelineItem({ color, icon: Icon, time, title, desc, attachment }) {
    const bg = color === 'red' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';

    return (
        <div className="relative pl-8">
            <div className={`absolute left-0 top-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center border-2 border-white shadow-sm z-10`}>
                <Icon size={14} />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800">{time}</span>
                    <span className="text-xs font-medium text-slate-500">{title}</span>
                </div>
                <p className="text-sm text-slate-600">{desc}</p>
                {attachment && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                        <Download size={12} /> {attachment}
                    </div>
                )}
            </div>
        </div>
    )
}

function Comment({ user, time, text, likes }) {
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">AN</div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800">{user}</span>
                    <span className="text-xs text-slate-400">{time}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl">
                    {text}
                </p>
                <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-slate-400">
                    <button className="hover:text-slate-600">Reply</button>
                    <button className="hover:text-slate-600">Like ({likes})</button>
                </div>
            </div>
        </div>
    )
}
