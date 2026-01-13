import React from 'react';
import { Zap, Battery, Sun, DollarSign, FileText } from 'lucide-react';

export default function SystemDetailsCard({ project }) {
    const specs = project.systemSpecs || {};

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col h-full">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">System Configuration</h3>

            <div className="grid grid-cols-2 gap-4 mb-auto">
                <SpecItem icon={Zap} label="Inverter" value={specs.inverter || '-'} color="text-amber-500 bg-amber-50" />
                <SpecItem icon={Battery} label="Battery" value={specs.battery || '-'} color="text-green-500 bg-green-50" />
                <SpecItem icon={Sun} label="Solar Array" value={specs.solar || specs.solarArray || '-'} color="text-blue-500 bg-blue-50" />
                <SpecItem icon={DollarSign} label="Value" value={specs.value ? `₦${Number(specs.value).toLocaleString()}` : 'N/A'} color="text-slate-500 bg-slate-50" />
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <ActionButton label="Spec" />
                <ActionButton label="Audit" />
                <ActionButton label="Quote" />
            </div>
        </div>
    );
}

function SpecItem({ icon: Icon, label, value, color }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[10px] text-slate-400 uppercase font-medium">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}

function ActionButton({ label }) {
    return (
        <button className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1">
            <FileText size={12} />
            {label}
        </button>
    )
}
