import React from 'react';
import { ReviewSection, ReviewField, ReviewTable, ReviewPhotos } from '../universal/ReviewComponents';
import { UniversalReview } from './UniversalReview';
import { Zap, Battery, Sun, ClipboardCheck, Cable, Truck, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import primistineLogo from '../../../assets/primistine-logo.png';

export const SolarReview = ({ auditData, onSubmit, onEdit, ...rest }) => {
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
                <h2 className="text-3xl font-bold text-premium-blue-900 tracking-tight">SOLAR AUDIT - {universal?.clientName?.toUpperCase() || 'CLIENT'}</h2>
                <p className="text-slate-500 mt-2">Comprehensive Site Assessment & System Design Verification</p>
            </div>

            {/* 1. SECTION: Client & Property (Via UniversalReview) */}
            <UniversalReview data={universal} />

            {/* 2. SECTION: Grid Supply Context */}
            <ReviewSection title="GRID SUPPLY CONTEXT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReviewField label="Avg. Daily Grid Supply" value={`${serviceSpecific.gridHours || 0} Hours`} />
                    <ReviewField label="Supply Phase" value={serviceSpecific.phase} />
                </div>
            </ReviewSection>

            {/* 3. SECTION: Roof Assessment */}
            <ReviewSection title="ROOF ASSESSMENT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Roof Material" value={serviceSpecific.roofMaterial} />
                    <ReviewField label="Orientation (Azimuth)" value={serviceSpecific.capturedOrientation ? `${serviceSpecific.capturedOrientation}°` : serviceSpecific.orientation} />
                    <ReviewField label="Roof Tilt" value={serviceSpecific.capturedTilt ? `${serviceSpecific.capturedTilt}°` : serviceSpecific.roofPitch} />
                    <ReviewField label="Shading Obstructions" value={(serviceSpecific.obstructions || []).join(', ') || 'None identified'} />
                </div>
                {serviceSpecific.roofPhotos && serviceSpecific.roofPhotos.length > 0 && (
                    <ReviewPhotos photos={serviceSpecific.roofPhotos} title="Roof Condition Photos" />
                )}
            </ReviewSection>

            {/* 4. SECTION: Access & Logistics */}
            <ReviewSection title="ACCESS & LOGISTICS">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReviewField label="Vehicle Access" value={serviceSpecific.vehicle ? 'Available' : 'Restricted'} />
                    <ReviewField label="Ladder Access" value={serviceSpecific.ladder ? 'Available' : 'Needed'} />
                    <ReviewField label="Working Hours" value={serviceSpecific.hours ? 'Restricted' : 'Standard'} />
                </div>
            </ReviewSection>

            {/* 5. SECTION: Load Audit Assessment */}
            <ReviewSection title="LOAD AUDIT ASSESSMENT">
                <div className="mb-6">
                    <ReviewTable
                        data={serviceSpecific.items?.map(i => ({
                            item: i.name,
                            power: `${i.power}W`,
                            qty: i.qty,
                            hours: i.hours,
                            energy: `${(i.power * i.qty * i.hours / 1000).toFixed(2)} kWh`,
                            critical: i.critical ? '✓' : ''
                        }))}
                        columns={['Appliance', 'Power', 'Qty', 'Hours', 'Energy (kWh)', 'Critical']}
                        emptyMessage="No appliances recorded."
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                        <ReviewField label="Total Connected Load" value={`${auditResults.totalLoad.toFixed(2)} kW`} />
                        <ReviewField label="Peak Simultaneous Load" value={`${auditResults.peakLoad.toFixed(2)} kW`} />
                    </div>
                    <div className="space-y-2">
                        <ReviewField label="Total Daily Energy" value={`${auditResults.dailyEnergy.toFixed(2)} kWh/day`} />
                        <ReviewField label="Surge Power Requirement" value={`${auditResults.surgePower.toFixed(2)} kW`} />
                    </div>
                </div>
            </ReviewSection>

            {/* 6. SECTION: Distribution Board (DB) Assessment */}
            <ReviewSection title="DISTRIBUTION BOARD (DB) ASSESSMENT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="DB Type" value={serviceSpecific.dbType} />
                    <ReviewField label="Breaker Quality" value={serviceSpecific.mcbQuality} />
                    <ReviewField label="Circuit Count" value={serviceSpecific.circuitCount} />
                    <ReviewField label="Spare Ways" value={serviceSpecific.spareCount} />
                    <ReviewField label="Condition Rating" value={`${serviceSpecific.dbCondition || 0} / 5`} />
                    <ReviewField label="Identified Issues" value={(serviceSpecific.dbIssues || []).join(', ') || 'None'} />
                </div>
            </ReviewSection>

            {/* 7. SECTION: Realistic System Sizing (The "Meat") */}
            <ReviewSection title="REALISTIC SYSTEM SIZING & DESIGN" className="ring-2 ring-premium-blue-500/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-premium-gold-400 mb-2">
                            <Zap size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Inverter</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recInverter} kVA</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Battery size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Battery</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recBattery} kWh</div>
                        <div className="text-[10px] text-slate-400 mt-1">{auditResults.batteryType} Technology</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-orange-400 mb-2">
                            <Sun size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Solar</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.recSolarResult} kWp</div>
                        <div className="text-[10px] text-slate-400 mt-1">{auditResults.targetCoverage}% Coverage</div>
                    </div>
                </div>

                {/* Sizing Transparency (Formulas) */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-premium-blue-600" />
                        Sizing Methodology & Proofs
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                            <p className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-tight">
                                <Zap size={12} /> Inverter Sizing Proof
                            </p>
                            <p>• Diversity Math: {auditResults.totalLoad.toFixed(1)}kW × {auditResults.diversityFactor} (Div.) = {auditResults.peakLoad.toFixed(1)}kW Peak</p>
                            <p>• Continuous Load Req: {auditResults.peakLoad.toFixed(1)}kW × 1.25 (Safety) = {(auditResults.peakLoad * 1.25).toFixed(1)}kVA</p>
                            <p>• Surge Load Req: {auditResults.surgePower.toFixed(1)}kW ÷ 2.5 (Surge Limit) = {(auditResults.surgePower / 2.5).toFixed(1)}kVA</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                            <p className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-tight">
                                <Battery size={12} /> Battery Sizing Proof ({auditResults.batteryType})
                            </p>
                            <p>• Target Autonomy: {auditResults.estAutonomy}h Backup Goal</p>
                            <p>• Daily Independence Goal: {auditResults.dailyEnergy.toFixed(1)}kWh × {auditResults.targetCoverage}% × 0.7 = {(auditResults.dailyEnergy * auditResults.targetCoverage / 100 * 0.7).toFixed(1)}kWh</p>
                            <p>• Efficiency (DoD Applied): Required Energy ÷ {auditResults.batteryDoD} = {auditResults.recBattery.toFixed(1)}kWh</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                            <p className="font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-tight">
                                <Sun size={12} /> Solar PV Harvesting Proof
                            </p>
                            <p>• Solar Requirement: {(auditResults.dailyEnergy * auditResults.targetCoverage / 100).toFixed(1)}kWh Daily Demand</p>
                            <p>• Harvesting Factor: 4.5h Peak Sun × 0.8 (System Losses) = 3.6h Effective</p>
                            <p>• Sizing Result: Requirement ÷ 3.6h = {auditResults.recSolarResult}kWp</p>
                        </div>
                    </div>
                </div>
            </ReviewSection>

            {/* 8. SECTION: System Overrides & Notes */}
            <ReviewSection title="SYSTEM OVERRIDES & NOTES">
                <ReviewField label="Preferred Brand" value={serviceSpecific.preferredBrand} />
                <div className="mt-4">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Design Team Notes</label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm italic text-slate-600">
                        {serviceSpecific.designNotes || 'No additional design notes provided.'}
                    </div>
                </div>
            </ReviewSection>

            {/* Warnings Summary if any */}
            {auditResults.warnings?.length > 0 && (
                <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem]">
                    <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-3">
                        <AlertTriangle size={20} /> Critical Design Warnings
                    </h4>
                    <div className="space-y-2">
                        {auditResults.warnings.map((w, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-amber-900 bg-white/50 p-3 rounded-xl border border-amber-100">
                                <span className="font-bold text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded uppercase mt-0.5">{w.component}</span>
                                {w.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!rest.readOnly && (
                <div className="flex gap-4 justify-center mt-12 pt-8 border-t border-slate-200">
                    <button
                        className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2"
                        onClick={onEdit}
                    >
                        <span>✏️</span> Edit Details
                    </button>
                    <button
                        className="px-12 py-4 bg-premium-blue-900 text-white font-extrabold rounded-2xl shadow-2xl shadow-premium-blue-900/40 hover:bg-premium-blue-800 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                        onClick={onSubmit}
                    >
                        <span>🚀</span> Submit Audit Response
                    </button>
                </div>
            )}
        </div>
    );
};
