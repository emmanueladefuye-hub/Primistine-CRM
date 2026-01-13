import React from 'react';
import { Clock } from 'lucide-react';
import clsx from 'clsx';

export default function ProjectStatusCard({ project }) {
    const phases = ['Planning', 'Procurement', 'Installation', 'Testing', 'Handover'];
    const currentPhaseIndex = phases.indexOf(project.currentPhase) !== -1 ? phases.indexOf(project.currentPhase) : 0;

    // Simulate progress if not provided, based on phase
    const progress = project.progress ?? (currentPhaseIndex / (phases.length - 1)) * 100;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Project Timeline</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    Due: {project.timeline?.expectedCompletion || 'TBD'}
                </span>
            </div>

            <div className="relative mb-6 px-2">
                {/* Timeline Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>

                {/* Phases */}
                <div className="flex justify-between relative z-10">
                    {phases.map((phase, index) => {
                        const isCompleted = index < currentPhaseIndex;
                        const isCurrent = index === currentPhaseIndex;

                        return (
                            <div key={phase} className="flex flex-col items-center">
                                <div className={clsx(
                                    "w-3 h-3 rounded-full border-2 transition-colors",
                                    isCompleted ? "bg-blue-600 border-blue-600" :
                                        isCurrent ? "bg-white border-blue-600 ring-4 ring-blue-50" :
                                            "bg-white border-slate-300"
                                )}></div>
                                <span className={clsx(
                                    "text-[10px] mt-2 font-medium",
                                    isCurrent ? "text-blue-700" : "text-slate-400"
                                )}>{phase}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Progress</span>
                    <span className="font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
