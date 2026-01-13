import React from 'react';
import { ReviewSection, ReviewField, ReviewPhotos, ReviewTable } from '../universal/ReviewComponents';
import { UniversalReview } from './UniversalReview';
import { Video, HardDrive, Wifi, ShieldAlert, Monitor, ClipboardCheck } from 'lucide-react';
import clsx from 'clsx';
import primistineLogo from '../../../assets/primistine-logo.png';

export const CCTVReview = ({ auditData, onSubmit, onEdit, ...rest }) => {
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
                <h2 className="text-3xl font-bold text-premium-blue-900 tracking-tight text-center uppercase">CCTV & SURVEILLANCE AUDIT - {universal?.clientName?.toUpperCase() || 'CLIENT'}</h2>
                <p className="text-slate-500 mt-2">Security Assessment & System Configuration Summary</p>
            </div>

            {/* 1. SECTION: Client & Property */}
            <UniversalReview data={universal} />

            {/* 2. SECTION: Security Assessment */}
            <ReviewSection title="SECURITY ASSESSMENT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField
                        label="Risk Level"
                        value={serviceSpecific.riskLevel}
                        className={clsx(
                            "font-bold",
                            serviceSpecific.riskLevel === 'High' ? "text-red-600" : serviceSpecific.riskLevel === 'Medium' ? "text-amber-600" : "text-emerald-600"
                        )}
                    />
                    <ReviewField label="Primary Concerns" value={(serviceSpecific.securityConcerns || []).join(', ') || 'General Monitoring'} />
                    <ReviewField label="Critical Monitoring Areas" value={(serviceSpecific.monitorAreas || []).join(', ') || 'Not specified'} />
                    <ReviewField label="Existing CCTV?" value={serviceSpecific.hasExistingCCTV ? `Yes (${serviceSpecific.cctvCondition})` : 'No'} />
                </div>
            </ReviewSection>

            {/* 3. SECTION: Infrastructure & Connectivity */}
            <ReviewSection title="INFRASTRUCTURE & CONNECTIVITY">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ReviewField label="Recorder Location" value={serviceSpecific.recorderLocation} />
                    <ReviewField label="Remote View Connectivity" value={serviceSpecific.cctvNetwork} />
                    <ReviewField label="Router Location" value={serviceSpecific.routerLocation} />
                    <ReviewField label="Static IP Required?" value={serviceSpecific.staticIPNeeded ? 'Yes' : 'No'} />
                </div>
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <ReviewField label="Noted Blind Spots" value={serviceSpecific.blindSpots || 'No significant blind spots noted.'} />
                </div>
            </ReviewSection>

            {/* 4. SECTION: Access & Logistics */}
            <ReviewSection title="ACCESS & LOGISTICS">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReviewField label="Vehicle Access" value={serviceSpecific.vehicle ? 'Available' : 'Restricted'} />
                    <ReviewField label="Ladder Access" value={serviceSpecific.ladder ? 'Available' : 'Needed'} />
                    <ReviewField label="Working Hours" value={serviceSpecific.hours ? 'Restricted' : 'Standard'} />
                </div>
            </ReviewSection>

            {/* 5. SECTION: Camera & Storage Summary */}
            <ReviewSection title="SYSTEM DESIGN SUMMARY" className="ring-2 ring-emerald-500/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Video size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Placement</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.totalCameras} Channels</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <HardDrive size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Storage</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.storageRequired} TB</div>
                        <div className="text-[10px] text-slate-400 mt-1">Estimated 30-Day Cycle</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <Wifi size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Cabling</span>
                        </div>
                        <div className="text-2xl font-bold">{auditResults.totalCableLength}m</div>
                        <div className="text-[10px] text-slate-400 mt-1">Cat6 / BNC Combined</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-emerald-600" />
                        Design Sizing Transparency
                    </h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600">
                        <p>• Channel Logic: {auditResults.totalCameras} Selected Cameras → Match to Next Standard NVR (4/8/16/32)</p>
                        <p>• Storage Logic: {auditResults.totalCameras} Cam × 15GB/day (H.265) × 30 Days ≈ {auditResults.storageRequired} TB</p>
                        <p>• Cable Math: {auditResults.totalCameras} Runs × 45m Avg ≈ {auditResults.totalCableLength}m Total Copper</p>
                    </div>
                </div>
            </ReviewSection>

            {/* 6. Action Buttons */}
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
                        <span>🚀</span> Finalize CCTV Audit
                    </button>
                </div>
            )}
        </div>
    );
};
