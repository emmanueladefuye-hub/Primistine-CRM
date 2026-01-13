import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, MoreVertical, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function ProjectHeader({ project }) {
    const navigate = useNavigate();

    if (!project) return null;

    const portalContent = (
        <div className="flex items-center gap-2 md:gap-4 animate-in fade-in slide-in-from-left-4 duration-500 min-w-0">
            <button
                onClick={() => navigate('/projects')}
                className="p-1.5 md:p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 group shrink-0"
                title="Back to Projects"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        <h1 className="text-xs md:text-sm font-black text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-[200px] xl:max-w-md">
                            {project.name}
                        </h1>
                        <span className={clsx(
                            "text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded-md uppercase tracking-tight font-black shadow-sm shrink-0",
                            project.status === 'In Progress' || project.status === 'Active' ? "bg-blue-600 text-white shadow-blue-100" :
                                project.status === 'Completed' ? "bg-emerald-500 text-white shadow-emerald-100" :
                                    "bg-slate-200 text-slate-600"
                        )}>
                            {project.status || 'Active'}
                        </span>
                    </div>

                    {/* Compact Client Info for Topbar */}
                    <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter overflow-hidden">
                        <span className="text-slate-900 truncate max-w-[80px] sm:max-w-[100px]">{project.clientInfo?.name}</span>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
                            <MapPin size={10} className="text-slate-300" />
                            {project.clientInfo?.address}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-100">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">Live</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const target = document.getElementById('app-header-portal');
    if (!target) return null;

    return createPortal(portalContent, target);
}
