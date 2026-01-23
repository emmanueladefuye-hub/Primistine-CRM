import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building, Edit3 } from 'lucide-react';
import clsx from 'clsx';

export default function LeadHeader({ lead, stageInfo, onEdit }) {
    if (!lead) return null;
    return (
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4 w-full">
                <Link to="/sales" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all hover:bg-slate-50 shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-xl sm:text-3xl font-black text-premium-blue-900 truncate tracking-tighter">
                            {lead.name} <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">v2</span>
                        </h1>
                        <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", stageInfo.color)}>{stageInfo.name}</span>
                    </div>
                    <p className="text-slate-500 flex items-center gap-2 mt-1.5 text-sm font-medium">
                        <Building size={14} className="text-slate-400" /> <span className="truncate">{lead.company}</span>
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto items-center justify-start md:justify-end">
                <button onClick={onEdit} className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 gap-2 flex items-center">
                    <Edit3 size={16} /> Edit
                </button>
            </div>
        </div>
    );
}
