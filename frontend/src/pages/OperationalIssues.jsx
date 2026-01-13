import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, Settings, BookOpen } from 'lucide-react';
import IssuesDashboard from '../components/operations/IssuesDashboard';
import IssuesAnalytics from '../components/operations/IssuesAnalytics';
import IssuesAdmin from '../components/operations/IssuesAdmin';
import IssuesKnowledgeBase from '../components/operations/IssuesKnowledgeBase';
import clsx from 'clsx';

/**
 * Main entry point for the Operational Issues module.
 * Handles top-level tab navigation between Dashboard, Analytics, Admin, and KB.
 */
export default function OperationalIssues() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const TABS = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
        { id: 'admin', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
            {/* Module Header / Tab Bar */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-6 pt-4">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 pb-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap min-w-max",
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'dashboard' && <IssuesDashboard />}
                {activeTab === 'analytics' && <IssuesAnalytics />}
                {activeTab === 'kb' && <IssuesKnowledgeBase />}
                {activeTab === 'admin' && <IssuesAdmin />}
            </div>
        </div>
    );
}
