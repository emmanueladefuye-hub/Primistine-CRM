import React from 'react';
import { CCTVReview } from './reviews/CCTVReview';
import { ElectricalReview } from './reviews/ElectricalReview';
import { GeneratorReview, EarthingReview } from './reviews/GenEarthingReviews';
import { IndustrialReview } from './reviews/IndustrialReview';
import { SolarReview } from './reviews/SolarReview';
import AuditSummary from './universal/AuditSummary';

export default function FinalReview({ data, onNext, setStep, services = [], showToast }) {

    // 1. Data Adapter: Transform wizard state to component-ready structure
    // We map the Wizard's data structure (client, site, load, infra, design) 
    // to the flat structure expected by the Review components.
    const getAdaptedData = () => {
        const universal = {
            ...data.client,
            photos: data.client?.photos || [],
            gps: data.client?.gps,
            engineerName: data.engineer || 'Demo Engineer'
        };

        // serviceSpecific merges all survey layers
        const serviceSpecific = {
            ...(data.site || {}),
            ...(data.load || {}),
            ...(data.infra || {}),
            ...(data.design || {}),

            // Explicit Mappings for clarity
            items: data.load?.items || [],
            cameras: data.load?.cameras || [],
            machinery: data.load?.machinery || [],
            hazards: data.site?.hazardsList || [],
            sitePhotos: data.site?.photos || [],
            roofPhotos: data.site?.photos || [],
        };

        // Unified Audit Results (Replaces autoCalculated / designResults)
        const auditResults = {
            // Shared Stats
            totalLoad: data.load?.stats?.totalLoad || 0,
            dailyEnergy: data.load?.stats?.totalDailyEnergy || 0,
            criticalLoad: data.load?.stats?.criticalLoad || 0,
            peakLoad: data.load?.stats?.peakSimultaneousLoad || 0,
            surgePower: data.load?.stats?.surgePower || 0,

            // Solar & Power Results
            recInverter: data.design?.recommendedInverter || 0,
            recBattery: data.design?.batteryCapacity || 0,
            recSolarResult: data.design?.solarArraySize || 0,
            estAutonomy: data.design?.backupHours || 0,
            independence: data.design?.independenceLevel || 0,
            monthlySavings: data.design?.monthlySavings || 0,
            payback: data.design?.paybackYears || 0,
            totalCost: data.design?.totalSystemCostEstimate || 0,

            // Solar Formula Context
            batteryType: data.design?.batteryType || 'Lithium',
            batteryDoD: data.design?.batteryType === 'Lead-acid' ? 0.5 : 0.8,
            diversityFactor: (data.load?.items || []).length > 10 ? 0.65 : 0.8,
            targetCoverage: data.design?.targetCoverage || 0,

            // CCTV Specifics
            totalCameras: (data.load?.cameras || []).length || (data.site?.cameras || []).length || 0,
            storageRequired: Math.ceil(((data.load?.cameras || []).length || (data.site?.cameras || []).length || 0) * 0.5),
            totalCableLength: ((data.load?.cameras || []).length || (data.site?.cameras || []).length || 0) * 45,

            // Generator & Wiring Specifics
            recommendedGenSize: Math.ceil((data.load?.stats?.totalLoad || 0) * 1.5),
            recommendedCableSize: (data.load?.stats?.totalLoad || 0) > 10 ? "16mm²" : "10mm²",
            fuelCost: Math.ceil((data.load?.stats?.totalLoad || 0) * 15000),

            warnings: data.design?.warnings || []
        };

        return { universal, serviceSpecific, auditResults };
    };

    const adaptedData = getAdaptedData();
    const primaryService = services[0];

    const handleSubmit = () => {
        onNext();
    };

    const handleEdit = () => {
        if (setStep) setStep(1); // Go back to Section 1 (Form)
        else {
            const formScroll = document.getElementById('audit-wizard-container');
            if (formScroll) formScroll.scrollIntoView({ behavior: 'smooth' });
            console.log("Edit requested - no step setter found");
        }
    };

    const renderServiceReview = () => {
        switch (primaryService) {
            case 'cctv':
                return <CCTVReview auditData={adaptedData} onSubmit={handleSubmit} onEdit={handleEdit} />;
            case 'wiring':
                return <ElectricalReview auditData={adaptedData} onSubmit={handleSubmit} onEdit={handleEdit} />;
            case 'generator':
                return <GeneratorReview auditData={adaptedData} onSubmit={handleSubmit} onEdit={handleEdit} />;
            case 'earthing':
                return <EarthingReview auditData={adaptedData} onSubmit={handleSubmit} onEdit={handleEdit} />;
            case 'industrial':
                return <IndustrialReview auditData={adaptedData} onSubmit={handleSubmit} onEdit={handleEdit} />;
            case 'solar':
                return <SolarReview auditData={adaptedData} onSubmit={handleSubmit} onEdit={handleEdit} />;
            default:
                return (
                    <div className="pb-12">
                        {/* Header Removed */}
                        <AuditSummary data={data} services={services} />
                        <div className="flex gap-4 justify-center mt-8 pt-6 border-t border-slate-200">
                            <button className="px-8 py-3 bg-premium-blue-900 text-white font-bold rounded-xl shadow-lg hover:bg-premium-blue-800" onClick={handleSubmit}>✅ Submit Audit</button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="container mx-auto animate-in fade-in zoom-in-95 duration-500">
            {renderServiceReview()}
        </div>
    );
}
