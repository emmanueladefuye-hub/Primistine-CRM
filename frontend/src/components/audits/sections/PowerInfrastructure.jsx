import React from 'react';
import { Settings, Zap, AlertTriangle, ShieldCheck, Wifi, Server, Activity, Battery, Cable, Construction, Gauge, Factory } from 'lucide-react';
import clsx from 'clsx';

export default function PowerInfrastructure({ data, updateData, onNext, services = [], showToast }) {
    const handleChange = (field, value) => {
        updateData({ [field]: value });
    };

    const isSolar = services.includes('solar');
    const isWiring = services.includes('wiring');
    const isCCTV = services.includes('cctv');
    const isGenerator = services.includes('generator');
    const isEarthing = services.includes('earthing');
    const isIndustrial = services.includes('industrial');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Grid Supply Context (Universal) */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-premium-gold-500" />
                    Grid Supply Context
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Average Daily Grid Supply (Hours)</label>
                        <input
                            type="range"
                            min="0" max="24" step="1"
                            value={data.gridHours || 0}
                            onChange={(e) => handleChange('gridHours', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-premium-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                            <span>0 Hrs (Off-grid)</span>
                            <span className="text-premium-blue-700 font-bold text-base">{data.gridHours || 0} Hours</span>
                            <span>24 Hrs</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Supply Phase</label>
                        <div className="flex gap-4">
                            {['Single Phase', 'Three Phase'].map(phase => (
                                <button
                                    key={phase}
                                    onClick={() => handleChange('phase', phase)}
                                    className={clsx(
                                        "flex-1 p-4 rounded-xl border text-sm font-medium transition-all",
                                        data.phase === phase
                                            ? "border-premium-blue-600 bg-premium-blue-50 text-premium-blue-900"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {phase}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Industrial Electrical Infrastructure */}
            {isIndustrial && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Factory size={20} className="text-slate-600" />
                        Industrial Electrical Infrastructure
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Main Panel Rating (Amps)</label>
                            <input
                                type="number"
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                                placeholder="e.g. 800A"
                                value={data.panelRating || ''}
                                onChange={(e) => handleChange('panelRating', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Distribution Boards</label>
                            <input
                                type="number"
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                                placeholder="e.g. 5"
                                value={data.dbCount || ''}
                                onChange={(e) => handleChange('dbCount', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Power Factor</label>
                            <input
                                type="number"
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                                placeholder="e.g. 0.85"
                                step="0.01"
                                value={data.powerFactor || ''}
                                onChange={(e) => handleChange('powerFactor', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Power Quality Issues Identified</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Voltage Sags/Swells', 'High Harmonics', 'Frequent Tripping', 'Overheating Cables', 'Flickering Lights', 'Motor Failures'].map(issue => (
                                <label key={issue} className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={(data.powerQualityIssues || []).includes(issue)}
                                        onChange={(e) => {
                                            const current = data.powerQualityIssues || [];
                                            handleChange('powerQualityIssues', e.target.checked
                                                ? [...current, issue]
                                                : current.filter(i => i !== issue)
                                            );
                                        }}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">{issue}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>
            )}


            {/* Detailed Distribution Board Assessment */}
            {(isSolar || isWiring || isIndustrial) && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-blue-50">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Distribution Board (DB) Assessment
                    </h3>

                    <div className="space-y-6">
                        {/* Basic DB Specs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">DB Type</label>
                                <select
                                    value={data.dbType || ''}
                                    onChange={(e) => handleChange('dbType', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                >
                                    <option value="">Select...</option>
                                    <option value="Flush Mount">Flush Mount (In Wall)</option>
                                    <option value="Surface Mount">Surface Mount</option>
                                    <option value="Old Fuse Model">Old Fuse Model (Needs Upgrade)</option>
                                    <option value="Industrial Panel">Industrial Floor Panel</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">MCB/Breaker Quality</label>
                                <select
                                    value={data.mcbQuality || ''}
                                    onChange={(e) => handleChange('mcbQuality', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                >
                                    <option value="">Select...</option>
                                    <option value="Premium">Premium (Schneider/ABB/Havells)</option>
                                    <option value="Standard">Standard (Reliable)</option>
                                    <option value="Low Quality">Low Quality / Generic</option>
                                    <option value="Mixed">Mixed Brands</option>
                                </select>
                            </div>
                        </div>

                        {/* Counts */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Total Circuits</label>
                                <input
                                    type="number"
                                    value={data.circuitCount || ''}
                                    onChange={(e) => handleChange('circuitCount', parseInt(e.target.value))}
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Spare Ways</label>
                                <input
                                    type="number"
                                    value={data.spareCount || ''}
                                    onChange={(e) => handleChange('spareCount', parseInt(e.target.value))}
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Condition & Issues */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">DB Condition & Issues</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {['Burnt Wires', 'Double Tapping', 'Loose Connections', 'No Labels', 'Exposed Busbar', 'Rust/Corrosion', 'Messy Wiring'].map(issue => (
                                    <label key={issue} className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all",
                                        (data.dbIssues || []).includes(issue)
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={(data.dbIssues || []).includes(issue)}
                                            onChange={(e) => {
                                                const current = data.dbIssues || [];
                                                handleChange('dbIssues', e.target.checked ? [...current, issue] : current.filter(i => i !== issue));
                                            }}
                                        />
                                        {issue}
                                    </label>
                                ))}
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <label className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-slate-700">Condition Rating:</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => handleChange('dbCondition', star)}
                                                className={clsx(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                                    (data.dbCondition || 0) >= star ? "bg-amber-400 text-white shadow-sm" : "bg-slate-200 text-slate-400"
                                                )}
                                            >
                                                {star}
                                            </button>
                                        ))}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Existing Wiring Assessment */}
            {isWiring && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                        <Cable size={20} className="text-orange-500" />
                        Existing Wiring Assessment
                    </h3>
                    <div className="space-y-6">

                        {/* Cable Specs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Main Cable Type</label>
                                <div className="flex gap-2">
                                    {['Copper', 'Aluminum', 'Unknown'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleChange('cableType', type)}
                                            className={clsx(
                                                "flex-1 py-2 border rounded-lg text-xs font-medium",
                                                data.cableType === type ? "bg-orange-50 border-orange-500 text-orange-800" : "bg-white text-slate-600"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Main Cable Size</label>
                                <select
                                    value={data.cableSize || ''}
                                    onChange={(e) => handleChange('cableSize', e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="">Select Size...</option>
                                    <option value="4mm">4mm²</option>
                                    <option value="6mm">6mm²</option>
                                    <option value="10mm">10mm² (Standard)</option>
                                    <option value="16mm">16mm² (Large)</option>
                                    <option value="25mm+">25mm²+</option>
                                </select>
                            </div>
                        </div>

                        {/* Wiring Condition */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Internal Wiring Condition</label>
                            <div className="space-y-3">
                                <select
                                    value={data.wiringCondition || ''}
                                    onChange={(e) => handleChange('wiringCondition', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                >
                                    <option value="">Overall Condition...</option>
                                    <option value="Excellent">Excellent (New/Clean)</option>
                                    <option value="Good">Good (Working)</option>
                                    <option value="Fair">Fair (Aging/Minor Issues)</option>
                                    <option value="Poor">Poor (Hazardous/Needs Replace)</option>
                                </select>

                                <div className="grid grid-cols-2 gap-2">
                                    {['Old Cables (Red/Black)', 'No Earth Wire', 'Joints in Roof', 'Undersized Cables', 'Mixed Gauges', 'Brittle Insulation'].map(issue => (
                                        <label key={issue} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={(data.wiringIssues || []).includes(issue)}
                                                onChange={(e) => {
                                                    const current = data.wiringIssues || [];
                                                    handleChange('wiringIssues', e.target.checked ? [...current, issue] : current.filter(i => i !== issue));
                                                }}
                                                className="rounded text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-xs text-slate-700">{issue}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Rewire Scope */}
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <label className="block text-sm font-bold text-orange-900 mb-2">Recommended Scope of Work</label>
                            <div className="space-y-2">
                                {['No Rewiring Needed', 'Partial Rewiring (Fix Faults Only)', 'Full Rewiring Required'].map(scope => (
                                    <label key={scope} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="rewireScope"
                                            value={scope}
                                            checked={data.rewireScope === scope}
                                            onChange={() => handleChange('rewireScope', scope)}
                                            className="text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-slate-800">{scope}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>
            )}

            {/* Generator & ATS Assessment (Generator / Industrial / Wiring) */}
            {(isGenerator || isIndustrial || isWiring) && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Settings size={20} className="text-premium-gold-500" />
                        {isGenerator ? 'Generator & ATS Systems' : 'Backup Power Integration'}
                    </h3>

                    <div className="space-y-8">

                        {/* 1. Existing Generator Specs */}
                        <div>
                            <label className="flex items-center gap-3 mb-4">
                                <span className="text-sm font-medium text-slate-700">Is there an existing Generator?</span>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button onClick={() => handleChange('genExists', true)} className={clsx("px-3 py-1 rounded text-xs font-bold transition-all", data.genExists ? "bg-white shadow text-slate-800" : "text-slate-400")}>YES</button>
                                    <button onClick={() => handleChange('genExists', false)} className={clsx("px-3 py-1 rounded text-xs font-bold transition-all", !data.genExists ? "bg-white shadow text-slate-800" : "text-slate-400")}>NO</button>
                                </div>
                            </label>

                            {data.genExists && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Brand / Make</label>
                                        <input type="text" value={data.genBrand || ''} onChange={(e) => handleChange('genBrand', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g. Mikano, Perkins" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Capacity (kVA)</label>
                                        <input type="number" value={data.genCapacity || ''} onChange={(e) => handleChange('genCapacity', parseFloat(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g. 20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fuel Type</label>
                                        <select value={data.genFuel || ''} onChange={(e) => handleChange('genFuel', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="">Select...</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Petrol">Petrol (PMS)</option>
                                            <option value="Gas">Gas / LPG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Condition</label>
                                        <select value={data.genCondition || ''} onChange={(e) => handleChange('genCondition', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="Excellent">Excellent</option>
                                            <option value="Good">Good</option>
                                            <option value="Fair">Fair (Aging)</option>
                                            <option value="Poor">Poor (Faulty)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. ATS / Changeover */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><Construction size={16} /> Changeover / ATS</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Existing Switch Type</label>
                                    <select value={data.atsType || ''} onChange={(e) => handleChange('atsType', e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
                                        <option value="Manual">Manual Knife Switch</option>
                                        <option value="Automatic">Automatic Transfer Switch (ATS)</option>
                                        <option value="Rotary">Rotary Changeover</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Switch Rating (Amps)</label>
                                    <input type="number" value={data.atsRating || ''} onChange={(e) => handleChange('atsRating', e.target.value)} className="w-full p-2 border rounded bg-white text-sm" placeholder="e.g. 100A" />
                                </div>
                                {data.atsType === 'Automatic' && (
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer border p-2 rounded bg-white">
                                            <input type="checkbox" checked={data.atsFunctional || false} onChange={(e) => handleChange('atsFunctional', e.target.checked)} className="rounded text-emerald-600" />
                                            <span className="text-xs font-medium text-slate-700">ATS is fully functional?</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Utility Context (PHCN) - Expanded for Generator Service */}
                        {isGenerator && (
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><Activity size={16} /> Grid & Priority Context</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Tariff Band</label>
                                        <select value={data.phcnBand || ''} onChange={(e) => handleChange('phcnBand', e.target.value)} className="w-full p-2 border rounded text-sm">
                                            <option value="">Select...</option>
                                            <option value="Band A">Band A (20+ hrs)</option>
                                            <option value="Band B">Band B (16+ hrs)</option>
                                            <option value="Band C">Band C (12+ hrs)</option>
                                            <option value="Band D">Band D (8+ hrs)</option>
                                            <option value="Band E">Band E (4+ hrs)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Voltage Stability</label>
                                        <select value={data.gridStability || ''} onChange={(e) => handleChange('gridStability', e.target.value)} className="w-full p-2 border rounded text-sm">
                                            <option value="Stable">Stable</option>
                                            <option value="Fluctuating">Fluctuating (Low/High)</option>
                                            <option value="Very Poor">Very Poor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Gen Auto-Start?</label>
                                        <div className="flex bg-slate-100 rounded p-1">
                                            <button onClick={() => handleChange('genAutoStart', true)} className={clsx("flex-1 py-1 rounded text-xs transition-colors", data.genAutoStart ? "bg-white shadow text-slate-800 font-bold" : "text-slate-500")}>YES</button>
                                            <button onClick={() => handleChange('genAutoStart', false)} className={clsx("flex-1 py-1 rounded text-xs transition-colors", !data.genAutoStart ? "bg-white shadow text-slate-800 font-bold" : "text-slate-500")}>NO</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </section>
            )}

            {/* Network & Connectivity (CCTV Only) */}
            {isCCTV && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-emerald-50">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Wifi size={20} className="text-emerald-500" />
                        Network & Connectivity
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Internet Available?</label>
                            <div className="flex gap-2">
                                {['Yes', 'No'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleChange('internetAvailable', opt === 'Yes')}
                                        className={clsx(
                                            "flex-1 p-2.5 rounded-lg border text-sm transition-all",
                                            data.internetAvailable === (opt === 'Yes')
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-medium"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Router Location</label>
                            <div className="relative">
                                <Server size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="e.g. Living Room, Office"
                                    value={data.routerLocation || ''}
                                    onChange={(e) => handleChange('routerLocation', e.target.value)}
                                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 text-sm"
                                />
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.staticIPNeeded || false}
                                    onChange={(e) => handleChange('staticIPNeeded', e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Client requires remote viewing (Needs Static IP / Cloud P2P)</span>
                            </label>
                        </div>
                    </div>
                </section>
            )}

            {/* Earthing Assessment (Universal + Detailed Earthing Service) */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-premium-gold-500" />
                    Earthing & Protection
                </h3>

                <div className="space-y-6">
                    {/* Universal Quick Check */}
                    <div>
                        <label className="flex items-center gap-3 mb-4">
                            <span className="text-sm font-medium text-slate-700">Does an Earthing System exist?</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => handleChange('hasEarthing', true)}
                                    className={clsx("px-3 py-1 rounded text-xs font-bold transition-all", data.hasEarthing ? "bg-white shadow text-emerald-600" : "text-slate-400 hover:text-slate-600")}
                                >
                                    YES
                                </button>
                                <button
                                    onClick={() => handleChange('hasEarthing', false)}
                                    className={clsx("px-3 py-1 rounded text-xs font-bold transition-all", !data.hasEarthing ? "bg-white shadow text-slate-600" : "text-slate-400 hover:text-slate-600")}
                                >
                                    NO
                                </button>
                            </div>
                        </label>

                        {/* Basic Resistance Value (Visual for Everyone) */}
                        {data.hasEarthing && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Measured Resistance (Ohms)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0 Ω"
                                        value={data.earthingValue || ''}
                                        onChange={(e) => handleChange('earthingValue', parseFloat(e.target.value))}
                                        className={clsx("w-full p-3 pl-10 rounded-xl border text-sm font-bold",
                                            (data.earthingValue > 5) ? "border-red-300 bg-red-50 text-red-700"
                                                : (data.earthingValue <= 1 && data.earthingValue > 0) ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200"
                                        )}
                                    />
                                    <Gauge size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                    {data.earthingValue > 1 && (
                                        <span className="absolute right-3 top-3.5 text-xs font-medium text-red-500">
                                            {data.earthingValue > 5 ? "Critical Fail (>5Ω)" : "Weak (>1Ω)"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detailed Earthing Service Fields */}
                    {isEarthing && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="h-px bg-slate-100 w-full" />

                            {/* Section 1: Existing System Details */}
                            {data.hasEarthing && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">System Type</label>
                                        <select value={data.earthingType || ''} onChange={(e) => handleChange('earthingType', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="">Select...</option>
                                            <option value="Copper Rod">Copper Rod</option>
                                            <option value="Plate">Plate Earthing</option>
                                            <option value="Mat">Earthing Mat</option>
                                            <option value="Chemical">Chemical / Maintenance Free</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Rod Count / Pits</label>
                                        <input type="number" value={data.rodCount || ''} onChange={(e) => handleChange('rodCount', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Physical Condition</label>
                                        <select value={data.earthPitCondition || ''} onChange={(e) => handleChange('earthPitCondition', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="Good">Good / Accessible</option>
                                            <option value="Buried">Buried / Lost</option>
                                            <option value="Corroded">Corroded / Dry</option>
                                            <option value="Disconnected">Disconnected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Test Equipment Used</label>
                                        <select value={data.testEquipment || ''} onChange={(e) => handleChange('testEquipment', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="Digital Tester">Digital Earth Tester</option>
                                            <option value="Clamp Meter">Clamp-on Meter</option>
                                            <option value="Multimeter">Multimeter (Continuity Only)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Soil & Site */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><Construction size={16} /> Soil assessment</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Soil Type</label>
                                        <select value={data.soilType || ''} onChange={(e) => handleChange('soilType', e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
                                            <option value="Loamy">Loamy (Normal)</option>
                                            <option value="Sandy">Sandy (High Res)</option>
                                            <option value="Clay">Clay (Good)</option>
                                            <option value="Rocky">Rocky (Very High Res)</option>
                                            <option value="Swampy">Swampy</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Moisture Level</label>
                                        <div className="flex gap-1">
                                            {['Dry', 'Moist', 'Wet'].map(m => (
                                                <button key={m} onClick={() => handleChange('soilMoisture', m)} className={clsx("flex-1 py-1 px-2 text-xs border rounded", data.soilMoisture === m ? "bg-blue-100 border-blue-400 text-blue-800" : "bg-white")}>{m}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Pit Area (m²)</label>
                                        <input type="number" value={data.pitSpace || ''} onChange={(e) => handleChange('pitSpace', e.target.value)} className="w-full p-2 border rounded bg-white text-sm" placeholder="Available space" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Lightning Protection */}
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm mb-3">Lightning Protection Risk</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Building Height (m)</label>
                                        <input type="number" value={data.buildingHeight || ''} onChange={(e) => handleChange('buildingHeight', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Risk Level</label>
                                        <div className="flex bg-slate-100 rounded p-1">
                                            {['Low', 'Med', 'High'].map(r => (
                                                <button key={r} onClick={() => handleChange('lightningRisk', r)} className={clsx("flex-1 py-1 rounded text-xs transition-colors", data.lightningRisk === r ? (r === 'High' ? "bg-red-500 text-white" : "bg-white shadow text-slate-700") : "text-slate-400")}>{r}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                                    <span className="text-sm font-medium text-slate-700">Lightning Arrester Required?</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleChange('arresterNeeded', true)} className={clsx("px-4 py-1.5 rounded-lg text-xs font-bold border", data.arresterNeeded ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-slate-200 text-slate-400")}>YES</button>
                                        <button onClick={() => handleChange('arresterNeeded', false)} className={clsx("px-4 py-1.5 rounded-lg text-xs font-bold border", !data.arresterNeeded && data.arresterNeeded !== undefined ? "bg-slate-100 text-slate-600" : "bg-white border-slate-200 text-slate-400")}>NO</button>
                                    </div>
                                </div>
                            </div>

                            {/* Equipment to Protect */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Equipment to Protect</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Solar Inverter', 'CCTV System', 'Server/IT', 'Medical Equip', 'Elevator', 'Production Line'].map(item => (
                                        <label key={item} className="flex items-center gap-2 px-3 py-1.5 border rounded-full hover:bg-slate-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(data.protectedEquip || []).includes(item)}
                                                onChange={(e) => {
                                                    const current = data.protectedEquip || [];
                                                    handleChange('protectedEquip', e.target.checked ? [...current, item] : current.filter(i => i !== item));
                                                }}
                                                className="rounded text-premium-gold-600"
                                            />
                                            <span className="text-xs font-medium text-slate-700">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}
