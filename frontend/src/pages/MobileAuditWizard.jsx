import React, { useState } from 'react';
import { ChevronRight, ArrowLeft, Sun, Zap, BarChart, AlertTriangle, Camera, CheckCircle, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function MobileAuditWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Solar Analysis
        roofType: '',
        shading: 'none',
        azimuth: '',

        // Electrical Health
        panelCondition: '',
        grounding: false,
        voltageL1: '',

        // Load Profiling
        peakLoad: '',
        averageDaily: '',
        criticalAppliances: [],

        // Risk
        roofStructure: '',
        floodingRisk: false,
    });

    const PHASES = [
        { id: 1, name: 'Solar Analysis', icon: Sun },
        { id: 2, name: 'Electrical Health', icon: Zap },
        { id: 3, name: 'Load Profiling', icon: BarChart },
        { id: 4, name: 'Risk Assessment', icon: AlertTriangle },
    ];

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = () => {
        // Simulate save
        setTimeout(() => {
            navigate('/audits');
        }, 1500);
    };

    return (
        <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex flex-col">
            {/* Mobile-first Header */}
            <div className="bg-premium-blue-900 text-white p-4 sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-4">
                    <Link to="/audits" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg">New Site Audit</h1>
                        <p className="text-xs text-premium-blue-200">Phase {step} of 4: {PHASES[step - 1].name}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-1.5 bg-premium-blue-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-premium-gold-500 transition-all duration-300"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Content Form */}
            <div className="flex-1 p-4 pb-24 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">

                    {/* Phase 1: Solar */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-premium-gold-600 mb-2">
                                <Sun size={24} />
                                <h2 className="text-xl font-bold text-slate-800">Solar Analysis</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Roof Type</label>
                                <select className="input-field" value={formData.roofType} onChange={e => setFormData({ ...formData, roofType: e.target.value })}>
                                    <option value="">Select Type</option>
                                    <option value="concrete">Concrete Deck</option>
                                    <option value="metal">Metal (Longspan)</option>
                                    <option value="shingles">Shingles</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Shading Analysis</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['None', 'Partial', 'Heavy'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFormData({ ...formData, shading: opt.toLowerCase() })}
                                            className={clsx("p-3 rounded-lg border text-sm font-medium transition-all",
                                                formData.shading === opt.toLowerCase()
                                                    ? "bg-premium-blue-50 border-premium-blue-500 text-premium-blue-700"
                                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
                                <Camera size={24} />
                                <span className="text-sm font-bold">Take Roof Photo</span>
                            </button>
                        </div>
                    )}

                    {/* Phase 2: Electrical */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-purple-600 mb-2">
                                <Zap size={24} />
                                <h2 className="text-xl font-bold text-slate-800">Electrical Health</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Distribution Panel Condition</label>
                                <select className="input-field" value={formData.panelCondition} onChange={e => setFormData({ ...formData, panelCondition: e.target.value })}>
                                    <option value="">Select Condition</option>
                                    <option value="good">Good / Organized</option>
                                    <option value="fair">Fair / Readable</option>
                                    <option value="poor">Poor / Chaotic</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="font-medium text-slate-700">Proper Grounding Found?</span>
                                <input
                                    type="checkbox"
                                    checked={formData.grounding}
                                    onChange={e => setFormData({ ...formData, grounding: e.target.checked })}
                                    className="w-6 h-6 accent-premium-blue-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Voltage Reading (L1)</label>
                                <input
                                    type="number"
                                    placeholder="220"
                                    className="input-field"
                                    value={formData.voltageL1}
                                    onChange={e => setFormData({ ...formData, voltageL1: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Phase 3: Load */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-green-600 mb-2">
                                <BarChart size={24} />
                                <h2 className="text-xl font-bold text-slate-800">Load Profiling</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Estimated Peak Load (kW)</label>
                                <input type="number" className="input-field" placeholder="e.g. 5.5" />
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Critical Appliances</label>
                                <div className="flex flex-wrap gap-2">
                                    {['ACs', 'Pumping Machine', 'Freezers', 'Microwave'].map(app => (
                                        <label key={app} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                                            <input type="checkbox" className="accent-premium-blue-900" />
                                            <span className="text-sm font-medium text-slate-700">{app}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase 4: Risk */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-red-500 mb-2">
                                <AlertTriangle size={24} />
                                <h2 className="text-xl font-bold text-slate-800">Risk Assessment</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="label-text">Roof Structural Integrity</label>
                                <textarea rows="3" className="input-field" placeholder="Notes on roof strength..."></textarea>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                                <span className="font-medium text-red-800">Flood Prone Area?</span>
                                <input
                                    type="checkbox"
                                    checked={formData.floodingRisk}
                                    onChange={e => setFormData({ ...formData, floodingRisk: e.target.checked })}
                                    className="w-6 h-6 accent-red-600"
                                />
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Persistent Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20 md:relative md:shadow-none">
                <div className="max-w-xl mx-auto flex gap-3">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50"
                    >
                        Back
                    </button>
                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="flex-[2] py-3 bg-premium-blue-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-premium-blue-900/20"
                        >
                            Next Phase <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            Submit Audit <Save size={20} />
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                .label-text { @apply block text-sm font-bold text-slate-500 uppercase mb-1; }
                .input-field { @apply w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900 transition-all font-medium text-slate-800; }
            `}</style>
        </div>
    );
}
