import React from 'react';
import { ReviewSection, ReviewField, ReviewPhotos } from '../universal/ReviewComponents';
import { UniversalReview } from './UniversalReview';
import { Zap, Activity, ShieldCheck, ClipboardCheck, Fuel } from 'lucide-react';
import clsx from 'clsx';

export const GeneratorReview = ({ auditData, onSubmit, onEdit, ...rest }) => {
    const { universal, serviceSpecific, auditResults } = auditData;

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-premium-blue-900 tracking-tight text-center uppercase">GENERATOR & POWER AUDIT - {universal?.clientName?.toUpperCase() || 'CLIENT'}</h2>
                <p className="text-slate-500 mt-2">Existing Gen Set & Changeover Infrastructure Assessment</p>
            </div>

            {/* 1. Client & Property */}
            <UniversalReview data={universal} />

            {/* 2. Existing Generator Assessment */}
            <ReviewSection title="GENERATOR ASSESSMENT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Generator Present?" value={serviceSpecific.generatorExists ? 'Yes' : 'No'} />
                    {serviceSpecific.generatorExists && (
                        <>
                            <ReviewField label="Brand / Model" value={serviceSpecific.genBrand} />
                            <ReviewField label="Capacity" value={`${serviceSpecific.genCapacity || 0} kVA`} />
                            <ReviewField label="Fuel Type" value={serviceSpecific.genFuelType} />
                            <ReviewField label="Current Condition" value={serviceSpecific.genCondition} />
                        </>
                    )}
                </div>
                {serviceSpecific.genPhotos && serviceSpecific.genPhotos.length > 0 && (
                    <ReviewPhotos photos={serviceSpecific.genPhotos} title="Generator Installation Photos" />
                )}
            </ReviewSection>

            {/* 3. ATS & Changeover Assessment */}
            <ReviewSection title="ATS & CHANGEOVER SYSTEM">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="ATS Available?" value={serviceSpecific.atsExists ? 'Yes' : 'No'} />
                    <ReviewField label="ATS Condition" value={serviceSpecific.atsCondition} />
                    <ReviewField label="Changeover Type" value={serviceSpecific.changeoverType} />
                </div>
            </ReviewSection>

            {/* 4. Infrastructure & Connectivity */}
            <ReviewSection title="GRID & CABLING CONTEXT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Grid Supply Phase" value={serviceSpecific.phase} />
                    <ReviewField label="Main Incoming Breaker" value={`${serviceSpecific.mainBreakerRating || 0}A`} />
                </div>
            </ReviewSection>

            {/* 5. System Recommendations */}
            <ReviewSection title="RECOMMENDED UPGRADES" className="ring-2 ring-premium-blue-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-premium-gold-400 mb-2">
                            <Zap size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Recommended Size</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recommendedGenSize} kVA</div>
                        <div className="text-[10px] text-slate-400 mt-1">Based on {auditResults.totalLoad.toFixed(1)}kW Total Load</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Fuel size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Est. Monthly Opex</span>
                        </div>
                        <div className="text-2xl font-bold">₦{auditResults.fuelCost.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Estimated Fuel Consumption</div>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-premium-blue-600" />
                        Sizing Methodology
                    </h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                        <p>• Gen Sizing: Total Connected Load ({auditResults.totalLoad.toFixed(1)}kW) ÷ 0.8 PF × 1.2 Safety Factor.</p>
                        <p>• Opex Estimate: Consumption rate of 0.35L per kVA/hour @ 6 hours daily usage.</p>
                    </div>
                </div>
            </ReviewSection>

            {/* 6. Action Buttons */}
            {!rest.readOnly && (
                <div className="flex gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
                    <button className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2" onClick={onEdit}><span>✏️</span> Edit Details</button>
                    <button className="px-12 py-4 bg-premium-blue-900 text-white font-extrabold rounded-2xl shadow-2xl shadow-premium-blue-900/40 hover:bg-premium-blue-800 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3" onClick={onSubmit}><span>🚀</span> Finalize Power Audit</button>
                </div>
            )}
        </div>
    );
};

export const EarthingReview = ({ auditData, onSubmit, onEdit, ...rest }) => {
    const { universal, serviceSpecific, auditResults } = auditData;

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-premium-blue-900 tracking-tight text-center uppercase">EARTHING PROTECTION AUDIT - {universal?.clientName?.toUpperCase() || 'CLIENT'}</h2>
                <p className="text-slate-500 mt-2">Lightning Protection & Grounding Continuity Assessment</p>
            </div>

            {/* 1. Client & Property */}
            <UniversalReview data={universal} />

            {/* 2. Earthing Assessment */}
            <ReviewSection title="EARTHING SYSTEM ASSESSMENT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Earthing Exists?" value={serviceSpecific.earthingExists ? 'Yes' : 'No'} />
                    <ReviewField label="Termination Type" value={serviceSpecific.earthingType} />
                    <ReviewField
                        label="Measured Resistance"
                        value={serviceSpecific.earthingValue != null ? `${serviceSpecific.earthingValue} Ω` : 'Not Measured'}
                        className={clsx(
                            "font-bold",
                            serviceSpecific.earthingValue < 2 ? "text-emerald-600" : "text-red-600"
                        )}
                    />
                    <ReviewField label="Soil Condition" value={serviceSpecific.soilType} />
                </div>
            </ReviewSection>

            {/* 3. Lightning Protection */}
            <ReviewSection title="LIGHTNING PROTECTION">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Lightning Arrestor Present?" value={serviceSpecific.hasLightningProtection ? 'Yes' : 'No'} />
                    <ReviewField label="Finial Type" value={serviceSpecific.lightningType} />
                    <ReviewField label="Arrestor Condition" value={serviceSpecific.lightningCondition} />
                </div>
            </ReviewSection>

            {/* 4. Technical Results */}
            <ReviewSection title="GROUNDING CONTINUITY RESULTS" className="ring-2 ring-emerald-500/20">
                <div className="flex items-center gap-6 p-6 bg-slate-900 rounded-3xl text-white">
                    <div className={clsx(
                        "p-4 rounded-2xl",
                        serviceSpecific.earthingValue < 2 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                        <ShieldCheck size={40} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Final Pass/Fail Status</div>
                        <div className="text-3xl font-black italic">
                            {serviceSpecific.earthingValue < 2 ? 'PASSED: < 2.0Ω' : 'FAILED: > 2.0Ω'}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            {serviceSpecific.earthingValue < 2
                                ? 'System meets Nigerian standard for safe earthing continuity.'
                                : 'Immediate earthing pit chemical treatment or additional rod required.'}
                        </p>
                    </div>
                </div>
            </ReviewSection>

            {/* 5. Action Buttons */}
            {!rest.readOnly && (
                <div className="flex gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
                    <button className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2" onClick={onEdit}><span>✏️</span> Edit Details</button>
                    <button className="px-12 py-4 bg-premium-blue-900 text-white font-extrabold rounded-2xl shadow-2xl shadow-premium-blue-900/40 hover:bg-premium-blue-800 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3" onClick={onSubmit}><span>🚀</span> Finalize Earthing Audit</button>
                </div>
            )}
        </div>
    );
};
