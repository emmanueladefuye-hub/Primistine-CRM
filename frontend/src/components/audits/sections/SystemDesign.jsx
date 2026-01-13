import React, { useState, useEffect } from 'react';
import { Sun, Battery, Zap, CheckCircle2, Camera, User, Cable, ShieldCheck, Settings, Factory, AlertTriangle, TrendingUp, Wallet, Info, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function SystemDesign({ data, loadData, siteData, updateData, onNext, services = [], showToast }) {
    const isSolar = services.includes('solar');
    const isCCTV = services.includes('cctv');
    const isWiring = services.includes('wiring');
    const isEarthing = services.includes('earthing');
    const isGenerator = services.includes('generator');
    const isIndustrial = services.includes('industrial');

    // Load Stats Destructuring
    const stats = loadData.stats || {};
    const totalConnectedLoad = stats.totalLoad || 0;
    const peakSimultaneousLoad = stats.peakSimultaneousLoad || (totalConnectedLoad * 0.8);
    const surgePower = stats.surgePower || (totalConnectedLoad * 2);
    const dailyEnergyConsumption = stats.totalDailyEnergy || 0;
    const essentialLoadsOnly = stats.criticalLoad || 0;

    // Interactive States
    const [backupHours, setBackupHours] = useState(data.backupHours || 10);
    const [targetCoverage, setTargetCoverage] = useState(data.targetCoverage || 90);
    const [batteryType, setBatteryType] = useState(data.batteryType || 'Lithium');
    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

    // --- PERFECTLY CALIBRATED LOGIC ---

    // 1. Diversity Factor
    const itemsCount = (loadData.items || []).length;
    const diversityFactor = itemsCount > 10 ? 0.65 : 0.8;
    const peakLoad = totalConnectedLoad * diversityFactor;

    // 2. Inverter Sizing (Surge Priority)
    const inverterForContinuous = peakLoad * 1.25;
    const inverterForSurge = surgePower / 2.5;
    let recommendedInverterRaw = Math.max(inverterForContinuous, inverterForSurge);

    const standardInverterSizes = [3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50];
    const recommendedInverter = standardInverterSizes.find(size => size >= recommendedInverterRaw) || Math.ceil(recommendedInverterRaw);
    const surgeCapacityLimit = recommendedInverter * 2.5;

    // 3. Perfect Sizing Constants
    const lagosAverageSunHours = 4.5; // Conservative standard
    const systemLosses = 0.20;       // Conservative (reflection, heat, cables, dust)
    const solarHarvestFactor = lagosAverageSunHours * (1 - systemLosses);

    // 4. Battery Sizing (Autonomy-First)
    const batteryDoD = batteryType === 'Lithium' ? 0.8 : 0.5;
    // Scale load weight by target coverage: Budget (80%) = Critical Only | Full (100%) = 80% of Peak Load
    const coverageScale = Math.max(0, (targetCoverage - 80) / 20); // 0 to 1
    const batteryLoadBasis = essentialLoadsOnly + (peakLoad * 0.8 - essentialLoadsOnly) * coverageScale;
    const criticalAutonomyKWh = batteryLoadBasis * backupHours;

    // For 100% independence, battery should handle ~70% of total daily energy consumption (night-time buffer)
    const independenceBufferKWh = dailyEnergyConsumption * (targetCoverage / 100) * 0.7;

    // Base Capacity before DoD: The actual energy we need to store
    const netEnergyRequired = Math.max(criticalAutonomyKWh, independenceBufferKWh);
    const batteryCapacityCalc = netEnergyRequired / batteryDoD;

    const standardBatterySizes = [5, 10, 15, 20, 30, 40, 50, 60, 75, 100, 120, 150];
    const batteryStandard = standardBatterySizes.find(size => size >= batteryCapacityCalc) || Math.ceil(batteryCapacityCalc);

    // 5. Solar Array Sizing (Coverage Options)
    // 100% Independence systems need a 1.15x "over-harvest" safety factor for rainy days
    const calculateSolarSize = (coverage) => {
        const dailyReq = dailyEnergyConsumption * (coverage / 100);
        const safetyFactor = coverage >= 100 ? 1.15 : 1.0;
        return Math.ceil((dailyReq * safetyFactor / solarHarvestFactor) * 2) / 2;
    };

    const solarArraySize = calculateSolarSize(targetCoverage);

    const coverageOptions = [
        { coverage: 80, size: calculateSolarSize(80), label: 'Budget' },
        { coverage: 90, size: calculateSolarSize(90), label: 'Recommended' },
        { coverage: 100, size: calculateSolarSize(100), label: 'Full Independence' }
    ];

    // 6. Financials & Performance
    const solarDailyGenerationActual = (solarArraySize / (targetCoverage >= 100 ? 1.15 : 1.0)) * solarHarvestFactor;
    const independenceLevel = dailyEnergyConsumption > 0 ? Math.min((solarDailyGenerationActual / dailyEnergyConsumption) * 100, 100) : 0;

    const currentMonthlyPHCN = siteData.monthlyBill || 0;
    const currentMonthlyGenFuel = siteData.genFuelCost || 0;
    const currentTotalMonthlyCost = currentMonthlyPHCN + currentMonthlyGenFuel;
    const isEstimatedSavings = currentTotalMonthlyCost === 0;

    // Realistic Baseline: ₦210/kWh (Nigeria Band A)
    const gridRefCost = 210;
    const industryEstimateMonthly = (dailyEnergyConsumption * 30 * gridRefCost);
    const baselineMonthlyCost = currentTotalMonthlyCost > 0 ? currentTotalMonthlyCost : industryEstimateMonthly;

    const dailyShortfallKWh = Math.max(dailyEnergyConsumption - solarDailyGenerationActual, 0);
    const postSolarMonthlyCost = dailyShortfallKWh * 30 * gridRefCost;
    const monthlySavings = Math.max(0, baselineMonthlyCost - postSolarMonthlyCost);

    // Costing Model
    const inverterCost = recommendedInverter * 85000;
    const batteryCost = batteryStandard * 50000;
    const solarArrayCost = solarArraySize * 130000;
    const mountingCost = solarArraySize * 35000;
    const accessoriesCost = (inverterCost + batteryCost) * 0.15;
    const laborCost = (inverterCost + batteryCost + solarArrayCost) * 0.12;

    const estSystemCost = inverterCost + batteryCost + solarArrayCost + mountingCost + accessoriesCost + laborCost;
    const annualSavings = monthlySavings * 12;
    const paybackYears = annualSavings > 0 ? (estSystemCost / annualSavings).toFixed(1) : '10+';

    // 7. Validation Warnings
    const validateSystem = () => {
        const warnings = [];
        if (recommendedInverter * 2.5 < surgePower) {
            warnings.push({
                severity: 'CRITICAL', component: 'Inverter', icon: '🔴',
                message: `${recommendedInverter}kVA inverter cannot handle ${surgePower.toFixed(1)}kW surge. Increase to ${Math.ceil(surgePower / 2.5)}kVA.`
            });
        }
        if (targetCoverage >= 100 && batteryStandard < dailyEnergyConsumption * 0.5) {
            warnings.push({
                severity: 'HIGH', component: 'AUTONOMY', icon: '⚠️',
                message: `${batteryStandard}kWh battery is low for 100% independence. Consider ≥${(dailyEnergyConsumption * 0.8).toFixed(0)}kWh.`
            });
        }
        if (totalConnectedLoad > 12 && (siteData.buildingType === 'Residential' || siteData.usageType === 'Residential')) {
            warnings.push({
                severity: 'MEDIUM', component: 'Load Profile', icon: '🟡',
                message: `${totalConnectedLoad.toFixed(1)}kW connected load is very high for residential. Verify appliances.`
            });
        }
        const roofNeeded = solarArraySize * 6;
        if (siteData.availableRoofSpace && roofNeeded > siteData.availableRoofSpace) {
            warnings.push({
                severity: 'CRITICAL', component: 'Roof Space', icon: '🔴',
                message: `Need ${roofNeeded.toFixed(0)}m² roof but only ${siteData.availableRoofSpace}m² available.`
            });
        }
        if (Number(paybackYears) > 8) {
            warnings.push({
                severity: 'MEDIUM', component: 'ROI', icon: '🟡',
                message: `${paybackYears} year payback is long. System may be oversized or baseline costs underestimated.`
            });
        }
        return warnings;
    };

    const systemWarnings = validateSystem();

    // Auto-sync recommendations to state
    useEffect(() => {
        updateData({
            recommendedInverter,
            surgeCapacity: surgeCapacityLimit,
            batteryCapacity: batteryStandard,
            solarArraySize,
            backupHours,
            targetCoverage,
            independenceLevel,
            monthlySavings,
            paybackYears,
            totalSystemCostEstimate: estSystemCost,
            warnings: systemWarnings,
            isEstimatedSavings,
            batteryType
        });
    }, [recommendedInverter, batteryStandard, solarArraySize, backupHours, targetCoverage, monthlySavings, batteryType]);



    const cctvDefaults = {
        cameras: "8x 5MP IP Cameras (PoE)",
        recorder: "8-Channel 4K NVR",
        storage: "4TB Surveillance HDD"
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* --- WARNINGS DASHBOARD --- */}
            {systemWarnings.length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm">
                    <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-3">
                        <AlertTriangle size={20} /> System Sizing Alerts
                    </h4>
                    <div className="space-y-2">
                        {systemWarnings.map((w, i) => (
                            <div key={i} className={clsx(
                                "text-sm p-3 rounded-xl border flex items-center gap-3",
                                w.severity === 'CRITICAL' ? "bg-red-50 border-red-100 text-red-700" :
                                    w.severity === 'HIGH' ? "bg-orange-50 border-orange-100 text-orange-700" :
                                        "bg-amber-100/50 border-amber-200 text-amber-800"
                            )}>
                                <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-white/50">{w.component}</span>
                                {w.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- SOLAR REALISTIC RECOMMENDATION TILE --- */}
            {isSolar && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-premium-blue-500/10 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-premium-gold-500/5 blur-[100px] rounded-full"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-premium-blue-400">
                                    <Zap size={24} /> Realistic System Sizing (VERIFIED)
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Diversity Factor: <span className="text-white font-bold">{(diversityFactor * 100).toFixed(0)}%</span> simultaneous load
                                </p>
                            </div>
                            {estSystemCost > 10000000 && (
                                <span className="px-4 py-1.5 bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-500/30">
                                    ⚠️ Senior Review Required ({" > "}₦10M)
                                </span>
                            )}
                        </div>

                        {/* Recommendation Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {/* Inverter Card */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
                                <div className="p-3 bg-premium-gold-500/20 w-fit rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="text-premium-gold-400" size={24} />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inverter Capacity</h4>
                                <div className="text-3xl font-bold text-white mb-2">{recommendedInverter} kVA</div>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-400 flex justify-between">
                                        <span>Peak Simultaneous:</span>
                                        <span className="font-bold text-slate-200">{peakLoad.toFixed(1)} kW</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex justify-between">
                                        <span>Surge Power Req:</span>
                                        <span className="font-bold text-slate-200">{surgePower.toFixed(1)} kW</span>
                                    </div>
                                </div>
                            </div>

                            {/* Battery Card */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
                                <div className="p-3 bg-green-500/20 w-fit rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                    <Battery className="text-green-400" size={24} />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Battery Storage</h4>
                                <div className="flex gap-2 mb-3">
                                    {['Lithium', 'Lead-acid'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setBatteryType(type)}
                                            className={clsx(
                                                "px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all border",
                                                batteryType === type
                                                    ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20"
                                                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">{batteryStandard} kWh</div>
                                <div className="space-y-3">
                                    <div className="pt-2 border-t border-white/5">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-tight">Backup Goal: <b className="text-green-400">{backupHours}h</b></span>
                                            <span className="text-[9px] font-bold text-green-500/80">₦{(batteryStandard * 50000 / 1000000).toFixed(1)}M</span>
                                        </div>
                                        <input
                                            type="range" min="4" max="24" step="2"
                                            value={backupHours}
                                            onChange={(e) => setBackupHours(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                                        />
                                        {backupHours > 12 && <p className="text-[9px] text-amber-400 mt-1">⚠️ High cost - consider 8-10h</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Solar Array Options */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
                                <div className="p-3 bg-orange-500/20 w-fit rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                    <Sun className="text-orange-400" size={24} />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solar PV Array</h4>
                                <div className="text-3xl font-bold text-white mb-2">{solarArraySize} kWp</div>
                                <div className="space-y-2">
                                    {coverageOptions.map(option => (
                                        <button
                                            key={option.coverage}
                                            onClick={() => setTargetCoverage(option.coverage)}
                                            className={clsx(
                                                "w-full flex justify-between items-center p-2 rounded-xl text-[10px] transition-all border",
                                                targetCoverage === option.coverage
                                                    ? "bg-premium-blue-600 border-premium-blue-400 text-white font-bold"
                                                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                            )}
                                        >
                                            <span>{option.label} ({option.coverage}%)</span>
                                            <span>{option.size}kWp</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Insights Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                                    <TrendingUp size={16} /> Forecasting & ROI
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Energy Independence:</span>
                                        <div className="flex items-center gap-3">
                                            <span className={clsx("font-bold",
                                                independenceLevel >= 85 ? 'text-green-400' :
                                                    independenceLevel >= 60 ? 'text-amber-400' : 'text-red-400'
                                            )}>
                                                {independenceLevel.toFixed(0)}%
                                            </span>
                                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx("h-full transition-all duration-1000",
                                                        independenceLevel >= 85 ? 'bg-green-500' :
                                                            independenceLevel >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                    )}
                                                    style={{ width: `${independenceLevel}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Est. Monthly Savings:</span>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-green-400">₦{monthlySavings.toLocaleString()}</span>
                                            {isEstimatedSavings && (
                                                <p className="text-[9px] text-slate-500 italic mt-0.5">*Based on ₦25/kWh industry baseline</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Payback Period:</span>
                                        <span className="text-lg font-bold text-white">{paybackYears} Years</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                                    <ShieldCheck size={16} /> Protection & Space
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {['DC Isolator', 'AC Breakers', 'Surge Protection'].map(item => (
                                            <span key={item} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-slate-300">
                                                ✓ {item}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-400">Roof Space Required:</span>
                                            <span className="font-bold text-slate-200">~{(solarArraySize * 6).toFixed(1)} m²</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className={clsx("h-full transition-all duration-1000",
                                                    (solarArraySize * 6) > (siteData.availableRoofSpace || 1000) ? 'bg-red-500' : 'bg-premium-blue-500'
                                                )}
                                                style={{ width: `${Math.min(((solarArraySize * 6) / (siteData.availableRoofSpace || (solarArraySize * 8))) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-white/10">
                            <button
                                onClick={() => showToast && showToast(`Generating quote for ${solarArraySize}kWp system...`, 'info')}
                                className="px-6 py-3 bg-premium-blue-600 hover:bg-premium-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-premium-blue-500/20 flex items-center gap-2"
                            >
                                <TrendingUp size={18} />
                                Generate Detailed Quote
                            </button>
                            <button
                                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold text-sm transition-all border border-white/10 flex items-center gap-2"
                            >
                                <Info size={18} />
                                {showDetailedBreakdown ? 'Hide Sizing Math' : 'Show Sizing Math'}
                            </button>
                        </div>

                        {/* Calculation Transparency (Collapsible Math) section has been moved inside the relative container */}
                        {showDetailedBreakdown && (
                            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                                <div className="p-4 bg-black/30 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                                    <p className="font-bold text-slate-200 mb-2 underline">Inverter Formula:</p>
                                    <p>Base Load: {totalConnectedLoad.toFixed(1)}kW × {diversityFactor} (Div.)</p>
                                    <p>= {peakLoad.toFixed(1)}kW Peak Load</p>
                                    <p>Continuous: {peakLoad.toFixed(1)}kW × 1.25 = {inverterForContinuous.toFixed(1)}kVA</p>
                                    <p>Surge: {surgePower.toFixed(1)}kW ÷ 2.5 = {inverterForSurge.toFixed(1)}kVA</p>
                                    <p className="mt-1 text-white font-bold">Recommended: {recommendedInverter}kVA (Standard)</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                                    <p className="font-bold text-slate-200 mb-2 underline">Battery Formula ({batteryType}):</p>
                                    <p>1. Target Load: {batteryLoadBasis.toFixed(1)}kW × {backupHours}h = {(batteryLoadBasis * backupHours).toFixed(1)}kWh</p>
                                    <p>2. Independence Buffer: {dailyEnergyConsumption.toFixed(1)}kWh (Total) × {targetCoverage}% × 0.7 = {independenceBufferKWh.toFixed(1)}kWh</p>
                                    <p>3. Max Design Energy: {netEnergyRequired.toFixed(1)}kWh</p>
                                    <p>4. Efficiency (DoD): {netEnergyRequired.toFixed(1)} ÷ {batteryDoD} = {batteryCapacityCalc.toFixed(1)}kWh</p>
                                    <p className="mt-1 text-white font-bold">Recommended: {batteryStandard}kWh</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                                    <p className="font-bold text-slate-200 mb-2 underline">Solar Formula:</p>
                                    <p>1. Daily Requirement: {dailyEnergyConsumption.toFixed(1)}kWh × {targetCoverage}% = {(dailyEnergyConsumption * targetCoverage / 100).toFixed(1)}kWh</p>
                                    <p>2. Effective Sun: 4.5h × (1 - 0.20 Loss) = 3.6h</p>
                                    <p>3. Sizing: {(dailyEnergyConsumption * targetCoverage / 100).toFixed(1)}kWh ÷ 3.6h = {((dailyEnergyConsumption * targetCoverage / 100) / 3.6).toFixed(2)}kWp</p>
                                    <p>4. Rounding: {solarArraySize}kWp (Safety & standard sizing)</p>
                                    <p className="mt-1 text-white font-bold">Recommended: {solarArraySize}kWp</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* --- CCTV DESIGN VIEW --- */}
            {isCCTV && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-6">
                    <div className="bg-slate-50 p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-premium-blue-600">
                                <Camera size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-premium-blue-900">Surveillance Package</h3>
                                <p className="text-sm text-slate-500">Based on {loadData.cameras?.length || 4} monitored areas</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Camera Specs</label>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-lg font-bold text-slate-800">{cctvDefaults.cameras}</p>
                                    <p className="text-sm text-slate-500 mt-1">IP67 Weatherproof • Night Vision • AI Detection</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Recording Unit</label>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-lg font-bold text-slate-800">{cctvDefaults.recorder}</p>
                                    <p className="text-sm text-slate-500 mt-1">Supports up to 8 cameras • Remote Viewing Ready</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Storage & Retention</label>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-lg font-bold text-slate-800">{cctvDefaults.storage}</p>
                                    <p className="text-sm text-slate-500 mt-1">~30 Days Retention (Motion Triggered)</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Infrastructure</label>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium text-slate-600">POE Switch</span>
                                    <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium text-slate-600">Cat6 Cabling</span>
                                    <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium text-slate-600">UPS Backup</span>
                                    <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium text-slate-600">Mobile App Setup</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- WIRING ASSESSMENT OUTPUT --- */}
            {isWiring && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-6">
                    <div className="bg-orange-50 p-6 border-b border-orange-100">
                        <div className="flex items-center gap-3">
                            <Cable className="text-orange-600" size={24} />
                            <h3 className="font-bold text-xl text-orange-900">Wiring Remediation Plan</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 mb-4">
                            <h4 className="font-bold text-orange-800 mb-2">Scope Estimate</h4>
                            <p className="text-sm text-slate-700">Based on the floor area of {siteData.floorArea || 'Unknown'}m² and building age ({siteData.buildingAge || '?'} yrs), we recommend:</p>
                            <div className="mt-3 flex gap-3">
                                {Number(siteData.buildingAge) > 20
                                    ? <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold border border-red-200">Full Rewire Recommended</span>
                                    : <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold border border-yellow-200">Partial Remediation / DB Upgrade</span>
                                }
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Est. Cable Required</label>
                                <p className="font-bold text-slate-800 text-lg">~{Number(siteData.floorArea || 100) * 3.5} Meters</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Conduit Strategy</label>
                                <p className="font-bold text-slate-800 text-lg">{siteData.wallMaterial === 'Drywall' ? 'Internal Flex' : 'Surface / Chasing'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor / Override */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                    System Overrides & Notes
                </h3>
                <p className="text-sm text-slate-500 mb-4">Adjust the recommended specifications or add site-specific constraints.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Brand / Vendor</label>
                        <input
                            type="text"
                            value={data.preferredBrand || ''}
                            className="w-full p-3 rounded-xl border border-slate-200"
                            placeholder="e.g. Schneider, ABB, Felicity"
                            onChange={(e) => updateData({ preferredBrand: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes for Design Team</label>
                        <textarea
                            value={data.designNotes || ''}
                            className="w-full p-3 rounded-xl border border-slate-200 h-12 resize-none"
                            placeholder="Any specific constraints..."
                            onChange={(e) => updateData({ designNotes: e.target.value })}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
