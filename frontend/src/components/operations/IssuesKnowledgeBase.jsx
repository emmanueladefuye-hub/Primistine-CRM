import React from 'react';
import { Search, ThumbsUp, Printer, Flag, BookOpen } from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';

export default function IssuesKnowledgeBase() {
    return (
        <div className="bg-slate-50 h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
                {/* HEADER & SEARCH */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">Solutions Library</h2>
                    <p className="text-slate-500 mb-6">Find answers from past resolved issues and technical guides.</p>

                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search e.g. 'Inverter overheating' or 'E07 error'..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg"
                        />
                    </div>
                </div>

                {/* RESULTS */}
                <div className="space-y-6">
                    <div className="text-center py-12 text-slate-400">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-600 mb-2">Knowledge Base Coming Soon</h3>
                        <p className="max-w-md mx-auto">
                            As high-severity issues are resolved, they will be documented here automatically for future reference.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SolutionCard({ title, severity, symptoms, steps, parts, author, votes }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <SeverityBadge severity={severity} />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Verified Solution</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                        ⭐ {votes}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-6">{title}</h3>

                <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Symptoms</h4>
                        <ul className="space-y-2">
                            {symptoms.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Resolution Steps</h4>
                        <ol className="space-y-2">
                            {steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="font-mono text-blue-500 font-bold text-xs mt-0.5">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="bg-slate-50 -mx-6 -mb-6 p-4 px-6 flex items-center justify-between text-sm">
                    <div className="text-slate-500">
                        Top Contributor: <span className="font-medium text-slate-700">{author}</span>
                    </div>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-1 text-slate-500 hover:text-green-600 font-medium">
                            <ThumbsUp size={16} /> Helpful
                        </button>
                        <button className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                            <Printer size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
