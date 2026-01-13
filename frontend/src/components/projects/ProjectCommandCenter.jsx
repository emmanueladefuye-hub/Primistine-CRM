import React from 'react';
import {
    Play,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ClipboardList,
    Camera,
    FileText,
    MessageSquare,
    Zap,
    ArrowRight,
    RotateCcw,
    CalendarDays
} from 'lucide-react';
import clsx from 'clsx';

export default function ProjectCommandCenter({ project, onAction, onNavigateToTab }) {
    if (!project) return null;

    const currentPhase = project.currentPhase || 'Planning';
    const progress = project.progress || 0;

    // Smart CTA Logic based on phase
    const getPhaseCTA = () => {
        switch (currentPhase) {
            case 'Planning':
                return {
                    title: "Ready for Procurement?",
                    description: "Initial planning is complete. Next step is to finalize material list.",
                    actionLabel: "Start Procurement",
                    actionId: "complete_phase",
                    color: "from-blue-600 to-indigo-700"
                };
            case 'Procurement':
                return {
                    title: "Materials Arriving?",
                    description: "Track your material delivery and prepare for installation setup.",
                    actionLabel: "Ready for Installation",
                    actionId: "complete_phase",
                    color: "from-indigo-600 to-purple-700"
                };
            case 'Installation':
                return {
                    title: "In the Field",
                    description: "Installation is underway. Ensure all site photos are uploaded daily.",
                    actionLabel: "Move to Testing",
                    actionId: "complete_phase",
                    color: "from-amber-500 to-orange-600"
                };
            case 'Testing':
                return {
                    title: "Final Validation",
                    description: "Run system tests and verify all specs match the design requirements.",
                    actionLabel: "Verify & Handover",
                    actionId: "complete_phase",
                    color: "from-emerald-500 to-teal-600"
                };
            case 'Handover':
                return {
                    title: "Project Completed",
                    description: "All phases are done. System is signed off and handed over to the client.",
                    actionLabel: "View Final Report",
                    actionId: "view_report",
                    color: "from-slate-700 to-slate-900"
                };
            default:
                return {
                    title: "Continue Progress",
                    description: "Keep pushing the project forward towards completion.",
                    actionLabel: "Complete Current Phase",
                    actionId: "complete_phase",
                    color: "from-blue-600 to-indigo-700"
                };
        }
    };

    const cta = getPhaseCTA();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. High Impact Hero Banner */}
            <div className={clsx(
                "relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl bg-gradient-to-br",
                cta.color
            )}>
                {/* Visual Flair */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-xl order-2 md:order-1">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase">
                                {currentPhase} Phase
                            </span>
                            <span className="text-white/60 hidden sm:inline">•</span>
                            <span className="text-white/80 text-[10px] md:text-xs font-medium italic">Project ID: #{project.id?.slice(-6).toUpperCase()}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                            {cta.title}
                        </h2>
                        <p className="text-white/80 text-sm md:text-lg font-medium mb-8 leading-relaxed max-w-md">
                            {cta.description}
                        </p>

                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={() => onAction(cta.actionId)}
                                className="flex-1 sm:flex-none justify-center bg-white text-slate-900 px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all shadow-xl flex items-center gap-3 group"
                            >
                                {cta.actionLabel}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            {(project.phase || project.currentPhase) !== 'Planning' && (
                                <button
                                    onClick={() => onAction('previous_phase')}
                                    className="p-3 md:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all group"
                                    title="Undo Progress"
                                >
                                    <RotateCcw size={20} className="group-hover:-rotate-45 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Premium Progress Ring */}
                    <div className="relative flex-shrink-0 flex items-center justify-center order-1 md:order-2 md:mr-12 lg:mr-20">
                        <svg className="w-28 h-28 md:w-40 md:h-40 transform -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="40%"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-white/10"
                            />
                            <circle
                                cx="50%"
                                cy="50%"
                                r="40%"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                // Adjusting radius for responsive svg mapping is tricky with hardcoded dashes, using relative percentages
                                strokeDasharray="251.32"
                                strokeDashoffset={251.32 * (1 - progress / 100)}
                                style={{ strokeDasharray: "calc(2 * 3.14159 * 40%)" }}
                                className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <style>{`
                            @media (max-width: 767px) {
                                .progress-ring-mobile {
                                    stroke-dasharray: 201; /* 2 * pi * 32 (approx for w-28) */
                                }
                            }
                        `}</style>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl md:text-5xl font-black tracking-tight">{progress}%</span>
                            <span className="text-[8px] md:text-[10px] font-bold text-white/50 tracking-[0.4em] uppercase">Status</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Tool Hub (The Toolkit) */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        Project Toolkit
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    </h3>
                    <p className="text-sm font-medium text-slate-400">Essential field actions</p>
                </div>

                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <ToolItem
                        icon={ClipboardList}
                        label="Project Log"
                        color="bg-sky-50 text-sky-600"
                        onClick={() => onNavigateToTab('Project Log')}
                    />
                    <ToolItem
                        icon={Camera}
                        label="Cloud Vault"
                        color="bg-purple-50 text-purple-600"
                        onClick={() => onNavigateToTab('Photos')}
                    />
                    <ToolItem
                        icon={FileText}
                        label="Audit Sync"
                        color="bg-emerald-50 text-emerald-600"
                        onClick={() => onAction('view_audit')}
                    />
                    <ToolItem
                        icon={AlertTriangle}
                        label="Report Issue"
                        color="bg-rose-50 text-rose-600"
                        onClick={() => onNavigateToTab('Issues')}
                    />
                    <ToolItem
                        icon={CalendarDays}
                        label="Field Visit"
                        color="bg-blue-50 text-blue-600"
                        onClick={() => onAction('schedule_visit')}
                    />
                    <ToolItem
                        icon={MessageSquare}
                        label="Client Chat"
                        color="bg-indigo-50 text-indigo-600"
                        onClick={() => onAction('message_client')}
                    />
                </div>
            </div>

            {/* 3. Snapshot Rows (Glanceable Info) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Completion</p>
                            <p className="text-lg font-black text-slate-800">{project.timeline?.expectedCompletion || 'TBD'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 text-lg font-bold">
                            ₦
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Value</p>
                            <p className="text-lg font-black text-slate-800">
                                ₦{project.value ? Number(project.value).toLocaleString() : project.systemSpecs?.value?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolItem({ icon: Icon, label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full aspect-square"
        >
            <div className={clsx(
                "w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                color
            )}>
                <Icon size={32} />
            </div>
            <span className="text-sm font-black text-slate-700 tracking-tight">{label}</span>
        </button>
    );
}
