import React from 'react';
import { User, MapPin, Phone, Mail, Home, Sun, Camera, Zap, Activity, Power, ShieldCheck, Factory, Settings, CheckCircle2, FileText, Battery } from 'lucide-react';
import clsx from 'clsx';

export default function AuditSummary({ data, services = [] }) {
    // Helper to calculate total load
    const calculateTotalLoad = () => {
        const items = data.load?.items || [];
        return items.reduce((acc, item) => acc + (item.power * item.qty), 0) / 1000;
    };

    // Helper to count cameras
    const calculateCameraCount = () => {
        const cameras = data.load?.cameras || [];
        return cameras.reduce((acc, cam) => acc + (cam.qty || 0), 0);
    };

    const totalLoadKW = calculateTotalLoad();
    const cameraCount = calculateCameraCount();

    // Recommendation Logic (Prioritize design stage data)
    const getSolarRecommendation = () => {
        if (data.design?.recommendedInverter) {
            return {
                inverter: `${data.design.recommendedInverter} kVA`,
                battery: `${data.design.batteryCapacity} kWh`,
                panels: `${data.design.solarArraySize} kWp`
            };
        }

        // Fallback to legacy threshold logic if design step skipped
        if (totalLoadKW < 3) return { inverter: '3.5kVA', battery: '5kWh', panels: '2kW' };
        if (totalLoadKW < 6) return { inverter: '5kVA', battery: '10kWh', panels: '4kW' };
        if (totalLoadKW < 10) return { inverter: '8kVA', battery: '15kWh', panels: '6kW' };
        return { inverter: '10kVA+', battery: '20kWh+', panels: '8kW+' };
    };

    const solarRec = getSolarRecommendation();

    return (
        <div className="space-y-6">

            {/* 1. Client & Site Context */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-premium-blue-900 flex items-center gap-2">
                        <User size={18} /> Client & Site Profile
                    </h3>
                    <span className="text-xs font-mono text-slate-400">Step 1 & 2</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500 text-sm">Client Name</span>
                            <span className="font-medium text-slate-900">{data.client?.clientName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500 text-sm">Phone</span>
                            <span className="font-medium text-slate-900">{data.client?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500 text-sm">Email</span>
                            <span className="font-medium text-slate-900">{data.client?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-slate-500 text-sm">Address</span>
                            <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">{data.client?.address || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500 text-sm">Building Type</span>
                            <span className="font-medium text-slate-900">{data.client?.buildingType || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500 text-sm">Ownership</span>
                            <span className="font-medium text-slate-900">{data.client?.ownership || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500 text-sm">GPS</span>
                            <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{data.client?.gps || 'Not Captured'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-slate-500 text-sm">Floors</span>
                            <span className="font-medium text-slate-900">{data.client?.floors || 1}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SOLAR & LOAD SUMMARY */}
            {services.includes('solar') && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Sun size={18} className="text-premium-gold-400" /> Solar Assessment
                        </h3>
                    </div>
                    <div className="p-6">

                        {/* Roof Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100">
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Roof Material</span>
                                <span className="font-bold text-slate-800">{data.site?.roofMaterial || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Orientation & Tilt</span>
                                <span className="font-bold text-slate-800">
                                    {data.site?.capturedOrientation ?
                                        `${data.site.capturedOrientation}° ${data.site.capturedOrientation < 45 || data.site.capturedOrientation > 315 ? 'N' : data.site.capturedOrientation < 135 ? 'E' : data.site.capturedOrientation < 225 ? 'S' : 'W'}`
                                        : 'N/A'}
                                    {data.site?.capturedTilt ? ` @ ${data.site.capturedTilt}° Tilt` : ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Shading</span>
                                <span className="font-bold text-slate-800">{data.site?.shading || 'None'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                <span className="block text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">Total Load</span>
                                <span className="block text-2xl font-bold text-blue-900">{totalLoadKW.toFixed(2)} kW</span>
                            </div>
                            <div className="flex-1 p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                <span className="block text-xs text-orange-500 uppercase font-bold tracking-wider mb-1">Est. Daily Usage</span>
                                <span className="block text-2xl font-bold text-orange-900">{(totalLoadKW * 5).toFixed(1)} kWh</span>
                            </div>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">System Recommendation</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 border border-slate-200 rounded-lg">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Zap size={12} /> Inverter</span>
                                <span className="font-bold text-slate-800">{solarRec.inverter}</span>
                            </div>
                            <div className="p-3 border border-slate-200 rounded-lg">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Battery size={12} /> Battery</span>
                                <span className="font-bold text-slate-800">{solarRec.battery}</span>
                            </div>
                            <div className="p-3 border border-slate-200 rounded-lg">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Sun size={12} /> Panels</span>
                                <span className="font-bold text-slate-800">{solarRec.panels}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CCTV & SECURITY SUMMARY */}
            {services.includes('cctv') && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <h3 className="font-bold text-blue-900 flex items-center gap-2">
                            <Camera size={18} /> CCTV Surveillance Plan
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Coverage Areas</h4>
                            <div className="flex flex-wrap gap-2">
                                {(data.load?.monitorAreas || ['Perimeter', 'Entrance']).map(area => (
                                    <span key={area} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-sm font-medium border border-slate-200">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Hardware Spec</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between border-b border-slate-50 pb-1">
                                    <span className="text-slate-600">Total Cameras</span>
                                    <span className="font-bold text-slate-900">{cameraCount} Units</span>
                                </li>
                                <li className="flex justify-between border-b border-slate-50 pb-1">
                                    <span className="text-slate-600">NVR Channels</span>
                                    <span className="font-bold text-slate-900">{cameraCount <= 4 ? 4 : cameraCount <= 8 ? 8 : 16} Channels</span>
                                </li>
                                <li className="flex justify-between pt-1">
                                    <span className="text-slate-600">Storage</span>
                                    <span className="font-bold text-slate-900">4TB HDD</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. ELECTRICAL WIRING SUMMARY */}
            {services.includes('wiring') && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                        <h3 className="font-bold text-orange-900 flex items-center gap-2">
                            <Zap size={18} /> Wiring Remediation
                        </h3>
                    </div>
                    <div className="p-6 flex items-start justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-sm text-slate-600">Building Age: <span className="font-bold text-slate-900">{data.site?.buildingAge || '?'} Years</span></p>
                            <p className="text-sm text-slate-600">Conduit Type: <span className="font-bold text-slate-900">{data.infra?.conduitType || 'Surface'}</span></p>
                            <p className="text-sm text-slate-600">DB Condition: <span className="font-bold text-slate-900">{data.infra?.dbCondition || 'N/A'}</span></p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-medium text-slate-500 block mb-1">Recommendation</span>
                            <span className={clsx(
                                "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase",
                                Number(data.site?.buildingAge) > 20 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                            )}>
                                {Number(data.site?.buildingAge) > 20 ? "Critical Rewire" : "Inspection / Partial"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. EARTHING & GENERATOR & INDUSTRIAL (Compact Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.includes('earthing') && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-green-900 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
                            <ShieldCheck size={16} className="text-green-600" /> Earthing
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Soil Type</span>
                                <span className="font-medium">{data.infra?.soilType || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Lightning Prot.</span>
                                <span className="font-bold text-slate-800">{data.infra?.lightningProtection ? 'Required' : 'Not Required'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Solution</span>
                                <span className="font-bold text-slate-800">{data.infra?.soilType === 'Sandy/Dry' ? 'Chemical' : 'Copper Rods'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {services.includes('generator') && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
                            <Settings size={16} className="text-slate-600" /> Gen / ATS
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Gen Size</span>
                                <span className="font-medium">{data.infra?.generatorCapacity || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">ATS Preference</span>
                                <span className="font-medium">{data.infra?.atsPreference || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Config</span>
                                <span className="font-bold text-slate-800">Auto-Start</span>
                            </div>
                        </div>
                    </div>
                )}

                {services.includes('industrial') && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm col-span-full">
                        <h3 className="font-bold text-red-900 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
                            <Factory size={16} className="text-red-600" /> Industrial Safety
                        </h3>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1 p-2 bg-red-50 rounded border border-red-100 text-center">
                                <span className="block text-xl font-bold text-red-700">{data.site?.hazardCount || 0}</span>
                                <span className="text-[10px] uppercase text-red-400 font-bold">Hazards</span>
                            </div>
                            <div className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-center">
                                <span className="block text-xl font-bold text-slate-700">{data.load?.items?.length || 0}</span>
                                <span className="text-[10px] uppercase text-slate-400 font-bold">Machinery</span>
                            </div>
                            <div className="flex-1 text-sm text-slate-600">
                                <p>Compliance: <span className="font-bold text-slate-900">Pending</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Photos Section */}
            {(data.client?.photos?.length > 0) && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Camera size={18} className="text-slate-500" /> Site Photos ({data.client.photos.length})
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {data.client.photos.map((photo, i) => (
                            <img key={i} src={photo} alt={`Site ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-slate-200 shrink-0" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
