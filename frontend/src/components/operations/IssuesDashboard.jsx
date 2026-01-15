import React, { useState } from 'react';
import {
    Plus, Search, AlertCircle, Clock, CheckCircle,
    User, Calendar, MapPin
} from 'lucide-react';
import clsx from 'clsx';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import SeverityBadge from '../ui/SeverityBadge';
import { useIssues } from '../../contexts/IssuesContext';
import ReportIssueModal from './ReportIssueModal';
import IssueDetailPanel from './IssueDetailPanel';

export default function IssuesDashboard() {
    const { issues, updateIssue, loading } = useIssues();
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Auto-scroll hooks
    const filterScroll = useAutoScroll();
    const listScroll = useAutoScroll();

    // Derived Data & Formatting
    const formattedIssues = (issues || []).map(issue => ({
        ...issue,
        timeAgo: calculateTimeAgo(issue.createdAt),
        isOverdue: isOverdue(issue.createdAt),
        reporter: issue.reporter || { name: 'Unknown' }
    }));

    // Filter Logic
    const filteredIssues = formattedIssues.filter(issue => {
        if (filterSeverity !== 'All' && issue.severity !== filterSeverity) return false;
        if (filterStatus !== 'All' && issue.status !== filterStatus) return false;
        if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Metrics Calculation
    const metrics = {
        critical: formattedIssues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length,
        overdue: formattedIssues.filter(i => i.isOverdue && i.status !== 'Resolved').length,
        open: formattedIssues.filter(i => i.status === 'Open').length,
        resolvedToday: formattedIssues.filter(i => i.status === 'Resolved' && isToday(i.updatedAt)).length,
        totalWeek: formattedIssues.filter(i => isThisWeek(i.createdAt)).length
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">

            {/* TOP METRICS (Dynamic) */}
            <div className="flex-none p-6 pb-2 space-y-6 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Operational Issues</h1>
                        <p className="text-slate-500">Manage field reports, safety hazards, and blockers.</p>
                    </div>
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Report Issue
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MetricCard label="Critical Issues" value={metrics.critical} color="red" icon={AlertCircle} />
                    <MetricCard label="Overdue" value={metrics.overdue} color="orange" icon={Clock} />
                    <MetricCard label="Open Issues" value={metrics.open} color="blue" icon={User} />
                    <MetricCard label="Resolved Today" value={metrics.resolvedToday} color="green" icon={CheckCircle} />
                    <MetricCard label="New This Week" value={metrics.totalWeek} color="slate" icon={Calendar} />
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden">

                {/* SIDEBAR FILTERS */}
                <div
                    ref={filterScroll.containerRef}
                    onMouseMove={filterScroll.handleMouseMove}
                    onMouseLeave={filterScroll.handleMouseLeave}
                    className="w-64 bg-slate-50 border-r border-slate-200 p-4 hidden lg:block flex-none overflow-y-auto no-scrollbar"
                >
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search issues..."
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Quick Status Summary */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status</h3>
                            <div className="space-y-1">
                                {['All', 'Open', 'In Progress', 'Resolved'].map(stat => (
                                    <FilterButton
                                        key={stat}
                                        label={stat}
                                        active={filterStatus === stat}
                                        onClick={() => setFilterStatus(stat)}
                                        count={stat === 'All' ? (issues || []).length : (issues || []).filter(i => i.status === stat).length}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Severity Filter */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">By Severity</h3>
                            <div className="space-y-1">
                                {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
                                    <FilterButton
                                        key={sev}
                                        label={sev}
                                        active={filterSeverity === sev}
                                        onClick={() => setFilterSeverity(sev)}
                                        count={sev === 'All' ? (issues || []).length : (issues || []).filter(i => i.severity === sev).length}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ISSUE LIST */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-1">Sev</div>
                        <div className="col-span-4 md:col-span-3">Issue Title</div>
                        <div className="col-span-2 hidden md:block">Location</div>
                        <div className="col-span-2 hidden lg:block">Reporter</div>
                        <div className="col-span-1 hidden sm:block">Age</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 md:col-span-1 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    <div
                        ref={listScroll.containerRef}
                        onMouseMove={listScroll.handleMouseMove}
                        onMouseLeave={listScroll.handleMouseLeave}
                        className="flex-1 overflow-y-auto no-scrollbar"
                    >
                        {loading && (
                            <div className="p-12 text-center text-slate-400">Loading issues...</div>
                        )}

                        {!loading && filteredIssues.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Search size={24} className="mx-auto mb-4 opacity-50" />
                                <p>No issues found.</p>
                            </div>
                        ) : (
                            filteredIssues.map(issue => (
                                <div
                                    key={issue.id}
                                    onClick={() => setSelectedIssue(issue)}
                                    className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center cursor-pointer group"
                                >
                                    {/* Severity */}
                                    <div className="col-span-1">
                                        <SeverityBadge severity={issue.severity} mini />
                                    </div>

                                    {/* Title */}
                                    <div className="col-span-4 md:col-span-3 pr-4">
                                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={issue.title}>
                                            {issue.title}
                                        </h4>
                                    </div>

                                    {/* Location */}
                                    <div className="col-span-2 hidden md:block text-sm text-slate-600 truncate flex items-center gap-1">
                                        <MapPin size={12} className="text-slate-400" />
                                        {issue.location || 'Unknown'}
                                    </div>

                                    {/* Reporter */}
                                    <div className="col-span-2 hidden lg:block">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                                {issue.reporter.name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-600 truncate">{issue.reporter.name}</span>
                                        </div>
                                    </div>

                                    {/* Age */}
                                    <div className="col-span-1 hidden sm:block text-xs font-medium">
                                        <span className={issue.isOverdue ? 'text-red-500' : 'text-slate-500'}>
                                            {issue.timeAgo}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 text-center">
                                        <span className={clsx(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide",
                                            issue.status === 'Open' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                issue.status === 'Resolved' ? "bg-green-50 text-green-700 border-green-200" :
                                                    "bg-slate-50 text-slate-600 border-slate-200"
                                        )}>
                                            {issue.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 md:col-span-1 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="View Details"
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS & PANELS */}
            <ReportIssueModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />

            <IssueDetailPanel
                issue={selectedIssue}
                onClose={() => setSelectedIssue(null)}
                onUpdate={updateIssue}
            />

        </div>
    );
}

// --- HELPERS ---

function calculateTimeAgo(dateInput) {
    if (!dateInput) return '';
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const diff = (new Date() - date) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function isOverdue(dateInput) {
    if (!dateInput) return false;
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return false;
    const diff = (new Date() - date) / 1000;
    return diff > 86400; // > 24h
}

function isToday(dateInput) {
    if (!dateInput) return false;
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function isThisWeek(dateInput) {
    if (!dateInput) return false;
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diff = (now - date) / 1000;
    return diff < 604800; // 7 days
}

function MetricCard({ label, value, color, icon: Icon }) {
    const colorClasses = {
        red: "text-red-600 bg-red-50",
        orange: "text-orange-600 bg-orange-50",
        blue: "text-blue-600 bg-blue-50",
        green: "text-green-600 bg-green-50",
        slate: "text-slate-600 bg-slate-50",
    }[color] || "text-slate-600 bg-slate-50";

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between h-24 relative overflow-hidden transition-colors">
            <div className="flex items-start justify-between relative z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                <span className={`p-1 rounded-md ${colorClasses}`}><Icon size={14} /></span>
            </div>
            <div className="relative z-10 mt-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800">{value}</span>
                </div>
            </div>
        </div>
    )
}

function FilterButton({ label, active, onClick, count }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex justify-between items-center group",
                active
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-100"
            )}
        >
            <span>{label}</span>
            <span className={clsx(
                "text-xs px-2 py-0.5 rounded-full transition-colors font-bold",
                active ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500 group-hover:bg-white"
            )}>
                {count}
            </span>
        </button>
    )
}
