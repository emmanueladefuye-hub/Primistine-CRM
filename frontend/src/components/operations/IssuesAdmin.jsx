import React from 'react';
import { Settings, Plus, Edit2, AlertTriangle, Clock, Trash2, Save } from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';

export default function IssuesAdmin() {
    return (
        <div className="bg-slate-50 h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Issue Settings</h2>
                        <p className="text-slate-500">Configure categories, SLA rules, and automation.</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                        <Save size={16} /> Save Changes
                    </button>
                </div>

                {/* SEVERITY RULES */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-slate-400" /> Severity Rules & SLA
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        <SeverityRule
                            severity="Critical"
                            desc="Safety hazard, work stoppage"
                            sla="30 mins"
                            timeline="4 hours"
                            auto="Manage (SMS), CEO"
                        />
                        <SeverityRule
                            severity="High"
                            desc="Significant delay, equipment failure"
                            sla="1 hour"
                            timeline="8 hours"
                            auto="Manager (Email)"
                        />
                        <SeverityRule
                            severity="Medium"
                            desc="Minor obstacle, workaround possible"
                            sla="4 hours"
                            timeline="24 hours"
                            auto="Email Only"
                        />
                        <SeverityRule
                            severity="Low"
                            desc="FYI, documentation"
                            sla="24 hours"
                            timeline="7 days"
                            auto="None"
                        />
                    </div>
                </div>

                {/* CATEGORIES */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Settings size={18} className="text-slate-400" /> Categories & Auto-Assignment
                        </h3>
                        <button className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                            <Plus size={14} /> Add Category
                        </button>
                    </div>
                    <div className="p-4 grid gap-4">
                        <CategoryCard
                            icon="⚡"
                            name="Equipment Failure"
                            assign="Senior Engineer"
                            severity="High"
                            notify="Inventory Team"
                        />
                        <CategoryCard
                            icon="📦"
                            name="Material Shortage"
                            assign="Inventory Lead"
                            severity="Medium"
                            notify="Procurement"
                        />
                        <CategoryCard
                            icon="🏗️"
                            name="Site Access"
                            assign="Project Manager"
                            severity="Medium"
                            notify="Client Liaison"
                        />
                        <CategoryCard
                            icon="👷"
                            name="Safety Concern"
                            assign="Safety Officer"
                            severity="Critical"
                            notify="CEO, Manager"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SeverityRule({ severity, desc, sla, timeline, auto }) {
    return (
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors">
            <div className="w-24 shrink-0">
                <SeverityBadge severity={severity} />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{desc}</p>
                <p className="text-xs text-slate-500 mt-1">Escalation: {auto}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600 shrink-0">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Res. SLA</span>
                    <span className="font-mono font-medium">{sla}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Fix SLA</span>
                    <span className="font-mono font-medium">{timeline}</span>
                </div>
                <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit2 size={16} />
                </button>
            </div>
        </div>
    )
}

function CategoryCard({ icon, name, assign, severity, notify }) {
    return (
        <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-xl">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                    <p className="text-xs text-slate-500">Auto-assign: <span className="text-blue-600">{assign}</span></p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <SeverityBadge severity={severity} className="hidden md:inline-flex" />
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    )
}
