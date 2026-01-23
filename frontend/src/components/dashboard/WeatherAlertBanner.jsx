import React from 'react';
import { CloudRain, Wind, Sun, AlertTriangle, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function WeatherAlertBanner({ projects }) {
    const navigate = useNavigate();

    // Filter projects with weather risk flagged by the n8n workflow
    const riskyProjects = (projects || []).filter(p =>
        p.weatherRisk?.severity === 'high' &&
        (p.phase === 'Installation' || p.phase === 'Testing')
    );

    if (riskyProjects.length === 0) return null;

    const getWeatherIcon = (alert) => {
        if (alert?.includes('Rain')) return CloudRain;
        if (alert?.includes('Wind')) return Wind;
        return Sun;
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 ring-4 ring-amber-50">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-amber-900 tracking-tight">Weather Advisory</h3>
                        <p className="text-amber-700/80 text-sm font-medium">
                            <span className="font-bold">{riskyProjects.length}</span> active installation{riskyProjects.length > 1 ? 's' : ''} may be impacted today
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {riskyProjects.slice(0, 3).map(project => {
                        const Icon = getWeatherIcon(project.weatherRisk?.alert);
                        return (
                            <button
                                key={project.id}
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl text-sm font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-all group"
                            >
                                <Icon size={16} className="text-amber-500" />
                                <span className="max-w-[120px] truncate">{project.name || project.clientName}</span>
                                <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        );
                    })}
                    {riskyProjects.length > 3 && (
                        <span className="text-xs font-black text-amber-600/60 px-3">
                            +{riskyProjects.length - 3} more
                        </span>
                    )}
                </div>
            </div>

            {/* Risk Summary Row */}
            <div className="mt-4 pt-4 border-t border-amber-200/50 flex flex-wrap gap-4">
                {riskyProjects.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="font-bold text-amber-800">{p.weatherRisk?.alert || 'Weather Risk'}</span>
                        <span className="text-amber-600/60">- {p.name?.substring(0, 20) || p.clientName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
