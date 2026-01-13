import React from 'react';
import { ReviewSection, ReviewField, ReviewTable, ReviewPhotos } from '../universal/ReviewComponents';
import { UniversalReview } from './UniversalReview';
import { Factory, ShieldAlert, Activity, ClipboardCheck, Zap } from 'lucide-react';
import clsx from 'clsx';
import primistineLogo from '../../../assets/primistine-logo.png';

export const IndustrialReview = ({ auditData, onSubmit, onEdit, ...rest }) => {
    const { universal, serviceSpecific, auditResults } = auditData;

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
            <div className="text-center mb-10 space-y-4">
                <div className="flex justify-center items-center gap-3">
                    <img src={primistineLogo} alt="Primistine Electric" className="w-16 h-16 rounded-lg" />
                    <div className="text-left">
                        <div className="font-bold text-2xl text-premium-blue-900 tracking-tight">PRIMISTINE</div>
                        <div className="text-sm text-premium-gold-500 font-semibold tracking-widest">ELECTRIC LIMITED</div>
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-premium-blue-900 tracking-tight text-center uppercase">INDUSTRIAL FACILITY AUDIT - {universal?.clientName?.toUpperCase() || 'CLIENT'}</h2>
                <p className="text-slate-500 mt-2">Safety Compliance & Power Infrastructure Assessment</p>
            </div>

            {/* 1. Client & Property */}
            <UniversalReview data={universal} />

            {/* 2. Facility Overview */}
            <ReviewSection title="FACILITY OVERVIEW">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Facility Type" value={serviceSpecific.facilityType} />
                    <ReviewField label="Shift Pattern" value={serviceSpecific.shiftPattern} />
                    <ReviewField label="Total Occupants" value={serviceSpecific.occupants} />
                    <ReviewField label="Operating Hours/Day" value={serviceSpecific.hoursPerDay} />
                </div>
            </ReviewSection>

            {/* 3. Safety Hazards Identification */}
            <ReviewSection title="SAFETY & HAZARDS ASSESSMENT" className="ring-1 ring-red-500/10">
                <div className="mb-4">
                    <label className="text-xs font-bold text-red-600 uppercase block mb-2 px-1">Identified Hazard Types</label>
                    <div className="flex flex-wrap gap-2 text-sm">
                        {(serviceSpecific.hazardTypes || []).length > 0 ? (
                            serviceSpecific.hazardTypes.map(h => (
                                <span key={h} className="px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200 font-medium">
                                    ⚠️ {h}
                                </span>
                            ))
                        ) : (
                            <span className="text-emerald-600 font-medium">No major hazard categories identified.</span>
                        )}
                    </div>
                </div>

                {serviceSpecific.hazardsList?.length > 0 && (
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2 px-1">Specific Hazard Log</label>
                        <ReviewTable
                            data={serviceSpecific.hazardsList.map(h => ({
                                location: h.location,
                                type: h.type,
                                risk: 'Needs Mitigation'
                            }))}
                            columns={['Location / Machine', 'Hazard Nature', 'Action Status']}
                            emptyMessage="No specific hazard entries."
                        />
                    </div>
                )}

                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <label className="text-xs font-bold text-red-700 uppercase block mb-1">Critical Auditor Notes</label>
                    <div className="text-sm text-red-900 italic">
                        {serviceSpecific.hazardNotes || 'No immediate critical threats recorded.'}
                    </div>
                </div>
            </ReviewSection>

            {/* 4. Power Infrastructure */}
            <ReviewSection title="INDUSTRIAL POWER INFRASTRUCTURE">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Main Panel Rating" value={`${serviceSpecific.panelRating || 0}A`} />
                    <ReviewField label="Total Distribution Boards" value={serviceSpecific.dbCount} />
                    <ReviewField label="Existing Power Factor" value={serviceSpecific.powerFactor} />
                    <ReviewField label="Grid Connectivity" value={serviceSpecific.phase} />
                </div>

                <div className="mt-4">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2 px-1">Noted Power Quality Issues</label>
                    <div className="flex flex-wrap gap-2">
                        {(serviceSpecific.powerQualityIssues || []).map(issue => (
                            <span key={issue} className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-medium">
                                {issue}
                            </span>
                        ))}
                        {(serviceSpecific.powerQualityIssues || []).length === 0 && (
                            <span className="text-slate-400 text-sm">None recorded.</span>
                        )}
                    </div>
                </div>
            </ReviewSection>

            {/* 5. System Design Summary */}
            <ReviewSection title="RECOMMENDED INFRASTRUCTURE SUMMARY" className="ring-2 ring-premium-blue-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-premium-gold-400 mb-2">
                            <Zap size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Inverter Requirement</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recInverter} kVA</div>
                        <div className="text-[10px] text-slate-400 mt-1">Industrial Grade Recommendation</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Activity size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Cable Standard</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recommendedCableSize}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Match for {auditResults.totalLoad.toFixed(1)}kW Load</div>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-premium-blue-600" />
                        Industrial Assessment Notes
                    </h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                        <p>• Sizing based on {auditResults.totalLoad.toFixed(2)} kW measured facility load.</p>
                        <p>• Power Quality Correction (PFC) Recommended based on {serviceSpecific.powerFactor} PF reading.</p>
                    </div>
                </div>
            </ReviewSection>

            {/* 6. Action Buttons */}
            {!rest.readOnly && (
                <div className="flex gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
                    <button className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2" onClick={onEdit}><span>✏️</span> Edit Details</button>
                    <button className="px-12 py-4 bg-premium-blue-900 text-white font-extrabold rounded-2xl shadow-2xl shadow-premium-blue-900/40 hover:bg-premium-blue-800 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3" onClick={onSubmit}><span>🚀</span> Finalize Industrial Audit</button>
                </div>
            )}
        </div>
    );
};
