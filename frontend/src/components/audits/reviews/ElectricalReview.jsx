import React from 'react';
import { ReviewSection, ReviewField, ReviewTable, ReviewPhotos } from '../universal/ReviewComponents';
import { UniversalReview } from './UniversalReview';
import { Zap, Activity, Cable, ShieldCheck, ClipboardCheck } from 'lucide-react';
import clsx from 'clsx';
import primistineLogo from '../../../assets/primistine-logo.png';

export const ElectricalReview = ({ auditData, onSubmit, onEdit, ...rest }) => {
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
                <h2 className="text-3xl font-bold text-premium-blue-900 tracking-tight text-center uppercase">ELECTRICAL WIRING AUDIT - {universal?.clientName?.toUpperCase() || 'CLIENT'}</h2>
                <p className="text-slate-500 mt-2">Internal Wiring Assessment & Distribution Summary</p>
            </div>

            {/* 1. Client & Property */}
            <UniversalReview data={universal} />

            {/* 2. Grid & Infrastructure */}
            <ReviewSection title="GRID & POWER CONTEXT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Grid Supply Phase" value={serviceSpecific.phase} />
                    <ReviewField label="Avg Daily Grid Supply" value={`${serviceSpecific.gridHours || 0} Hours`} />
                    <ReviewField label="Supply Stability" value={serviceSpecific.gridStability || 'Not Rated'} />
                </div>
            </ReviewSection>

            {/* 3. Load Assessment */}
            <ReviewSection title="LOAD AUDIT DETAILS">
                <ReviewTable
                    data={serviceSpecific.items?.map(i => ({
                        item: i.name,
                        power: `${i.power}W`,
                        qty: i.qty,
                        total: `${(i.power * i.qty / 1000).toFixed(2)} kW`,
                        type: i.category
                    }))}
                    columns={['Appliance', 'Power', 'Qty', 'Total Peak', 'Category']}
                    emptyMessage="No appliances recorded."
                />
                <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <ReviewField label="Total Connected Load" value={`${auditResults.totalLoad.toFixed(2)} kW`} />
                    <ReviewField label="Estimated Peak Load" value={`${auditResults.peakLoad.toFixed(2)} kW`} />
                </div>
            </ReviewSection>

            {/* 4. DB & Wiring Condition */}
            <ReviewSection title="WIRING & DISTRIBUTION ASSESSMENT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="DB Type" value={serviceSpecific.dbType} />
                    <ReviewField label="Breaker Quality" value={serviceSpecific.mcbQuality} />
                    <ReviewField label="Internal Wiring Age" value={`${serviceSpecific.buildingAge || 0} Years`} />
                    <ReviewField label="Wiring Standard" value={serviceSpecific.wiringStandard} className="font-bold text-premium-blue-700" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Condition Issues</label>
                        <div className="text-sm text-slate-700">{(serviceSpecific.wiringIssues || []).join(', ') || 'No critical issues observed.'}</div>
                    </div>
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <label className="text-xs font-bold text-blue-600 uppercase block mb-1">Recommended Scope</label>
                        <div className="text-sm font-bold text-blue-900">{serviceSpecific.rewireScope || 'Pending Assessment'}</div>
                    </div>
                </div>
            </ReviewSection>

            {/* 5. Protection Systems */}
            <ReviewSection title="PROTECTION & SAFETY">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Earthing Exists?" value={serviceSpecific.hasEarthing ? 'Yes' : 'No'} />
                    <ReviewField label="Measured Resistance" value={serviceSpecific.earthingValue ? `${serviceSpecific.earthingValue} Ω` : 'Not Measured'} />
                </div>
            </ReviewSection>

            {/* 6. Technical Recommendations */}
            <ReviewSection title="TECHNICAL RECOMMENDATIONS" className="ring-2 ring-blue-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Cable size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Main Cable</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recommendedCableSize}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Sized for {auditResults.totalLoad.toFixed(1)}kW Capacity</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <ShieldCheck size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Protection</span>
                        </div>
                        <div className="text-2xl font-bold">{serviceSpecific.hasEarthing && serviceSpecific.earthingValue < 2 ? 'PASSED' : 'UPGRADE'}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Grounding Continuity Audit</div>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-blue-600" />
                        Sizing Methodology
                    </h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                        <p>• Cable Sizing Logic: {auditResults.totalLoad.toFixed(1)}kW Load @ 230V → Required Ampacity match to BS7671 standards.</p>
                        <p>• Headroom Factor: 25% spare capacity included in recommendation ({auditResults.recommendedCableSize}).</p>
                    </div>
                </div>
            </ReviewSection>

            {/* 7. Action Buttons */}
            {!rest.readOnly && (
                <div className="flex gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
                    <button className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2" onClick={onEdit}><span>✏️</span> Edit Details</button>
                    <button className="px-12 py-4 bg-premium-blue-900 text-white font-extrabold rounded-2xl shadow-2xl shadow-premium-blue-900/40 hover:bg-premium-blue-800 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3" onClick={onSubmit}><span>🚀</span> Finalize Electrical Audit</button>
                </div>
            )}
        </div>
    );
};
