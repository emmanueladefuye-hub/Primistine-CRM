import React from 'react';
import { Sun, Video, Zap, Activity, ShieldCheck, Power } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const SERVICES = [
    {
        id: 'solar',
        title: 'Solar & Inverter',
        description: 'Comprehensive energy audit for solar/inverter sizing.',
        time: '35-45 mins',
        icon: Sun,
        color: 'bg-orange-50 text-orange-600',
        borderColor: 'border-orange-200',
        valid: true
    },
    {
        id: 'cctv',
        title: 'CCTV & Security',
        description: 'Security risk assessment and camera coverage planning.',
        time: '25-30 mins',
        icon: Video,
        color: 'bg-emerald-50 text-emerald-600',
        borderColor: 'border-emerald-200',
        valid: true
    },
    {
        id: 'wiring',
        title: 'Electrical Wiring',
        description: 'Load analysis, DB assessment, and rewiring check.',
        time: '30-40 mins',
        icon: Zap,
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200',
        valid: true
    },
    {
        id: 'earthing',
        title: 'Earthing & Surge',
        description: 'Earth resistance testing and lightning protection.',
        time: '20-25 mins',
        icon: Activity,
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200',
        valid: true
    },
    {
        id: 'generator',
        title: 'Generator / ATS',
        description: 'Generator integration and changeover setup.',
        time: '25-30 mins',
        icon: Power,
        color: 'bg-slate-100 text-slate-600',
        borderColor: 'border-slate-200',
        valid: true
    },
    {
        id: 'industrial',
        title: 'Industrial Safety',
        description: 'Comprehensive facility safety audit.',
        time: '60-90 mins',
        icon: ShieldCheck,
        color: 'bg-red-50 text-red-600',
        borderColor: 'border-red-200',
        valid: true
    }
];

export default function ServiceSelector({ selected, onSelect, onNext, showToast }) {
    const handleServiceSelect = (id) => {
        onSelect([id]);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-premium-blue-900 mb-2">What service are you auditing?</h2>
                <p className="text-slate-500">Select a service to begin your audit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICES.map((service) => {
                    const isSelected = selected.includes(service.id);
                    const Icon = service.icon;

                    return (
                        <motion.button
                            key={service.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleServiceSelect(service.id)}
                            className={clsx(
                                "relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all w-full",
                                isSelected
                                    ? "border-premium-blue-600 bg-premium-blue-50/50 ring-1 ring-premium-blue-600 shadow-lg shadow-premium-blue-900/5"
                                    : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md"
                            )}
                        >
                            <div className={clsx("p-3 rounded-xl shrink-0 transition-colors", service.color, isSelected ? "bg-premium-blue-100 text-premium-blue-700" : "")}>
                                <Icon size={24} strokeWidth={2} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className={clsx("font-bold text-lg mb-1", isSelected ? "text-premium-blue-900" : "text-slate-800")}>
                                    {service.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-3">
                                    {service.description}
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-medium border border-slate-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    {service.time}
                                </div>
                            </div>

                            {isSelected && (
                                <div className="absolute top-4 right-4 text-premium-blue-600">
                                    <div className="bg-premium-blue-600 text-white rounded-full p-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Removed Summary Block as per single-select flow */}
        </div>
    );
}
