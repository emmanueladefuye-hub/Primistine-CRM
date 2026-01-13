import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Zap, Monitor, BatteryCharging, Video, Factory, Settings } from 'lucide-react';
import clsx from 'clsx';

const APPLIANCE_PRESETS = [
    { name: 'LED Bulb', power: 10, category: 'Lighting' },
    { name: 'Ceiling Fan', power: 75, category: 'Cooling' },
    { name: 'LCD TV (42")', power: 120, category: 'Entertainment' },
    { name: 'Refrigerator (Medium)', power: 250, category: 'Kitchen', inductive: true },
    { name: 'Air Conditioner (1HP)', power: 1200, category: 'Cooling', inductive: true },
    { name: 'Air Conditioner (1.5HP)', power: 1800, category: 'Cooling', inductive: true },
    { name: 'Water Heater', power: 2000, category: 'Heating' },
    { name: 'Pumping Machine (1HP)', power: 750, category: 'Utility', inductive: true },
    { name: 'Laptop', power: 65, category: 'Office' },
    { name: 'Freezer', power: 300, category: 'Kitchen', inductive: true },
];

export default function LoadInventory({ data, updateData, onNext, services = [], showToast }) {
    const isSolar = services.includes('solar');
    const isCCTV = services.includes('cctv');
    const isWiring = services.includes('wiring');
    const isGenerator = services.includes('generator');
    const isIndustrial = services.includes('industrial');
    const isEarthing = services.includes('earthing');

    // Default to 'Standard' calculator if Solar is present or if nothing else matches specific needed modes
    const mode = isCCTV ? 'camera_planning'
        : isIndustrial ? 'industrial_load'
            : (isWiring || isEarthing) && !isSolar ? 'simplified'
                : 'standard'; // Default/Solar

    const [items, setItems] = useState(data.items || []);
    const [cameras, setCameras] = useState(data.cameras || []); // For CCTV

    // Calculations
    const totalLoad = items.reduce((acc, item) => acc + (item.power * item.qty), 0);
    const totalDailyEnergy = items.reduce((acc, item) => acc + (item.power * item.qty * (item.hours || 0)), 0);
    const criticalLoad = items.filter(i => i.critical).reduce((acc, item) => acc + (item.power * item.qty), 0);

    // Calculate surge power (approx based on inductive presets)
    const surgePower = items.reduce((acc, item) => {
        const isInductive = APPLIANCE_PRESETS.find(p => p.name === item.name)?.inductive || item.category === 'Cooling' || item.category === 'Kitchen' || item.category === 'Utility';
        return acc + (item.power * item.qty * (isInductive ? 3 : 1));
    }, 0);

    // Peak Simultaneous is often estimated at 70-80% of total load, or specific calculation
    const peakSimultaneousLoad = totalLoad * 0.8;

    // Auto-save
    useEffect(() => {
        if (mode === 'camera_planning') {
            updateData({ cameras });
        } else {
            updateData({
                items,
                stats: {
                    totalLoad: totalLoad / 1000,
                    totalDailyEnergy: totalDailyEnergy / 1000,
                    criticalLoad: criticalLoad / 1000,
                    surgePower: surgePower / 1000,
                    peakSimultaneousLoad: peakSimultaneousLoad / 1000
                }
            });
        }
    }, [items, cameras, mode, totalLoad, totalDailyEnergy, criticalLoad, surgePower, peakSimultaneousLoad]);


    // --- STANDARD CALCULATOR LOGIC (Solar / Generator) ---
    const [customName, setCustomName] = useState('');
    const [customPower, setCustomPower] = useState('');

    const addItem = (preset) => {
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: preset.name,
            power: preset.power,
            qty: 1,
            hours: 4,
            critical: false,
            category: preset.category || 'General'
        };
        setItems([...items, newItem]);
    };

    const addCustomItem = () => {
        if (customName && customPower) {
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: customName,
                power: parseInt(customPower),
                qty: 1,
                hours: mode === 'industrial_load' ? 8 : 4,
                critical: false,
                category: 'Custom'
            };
            setItems([...items, newItem]);
            setCustomName('');
            setCustomPower('');
        }
    };

    const updateItem = (id, field, value) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    const removeItem = (id) => setItems(items.filter(item => item.id !== id));



    // --- CCTV CAMERA PLANNING LOGIC ---
    const addCamera = (areaName) => {
        const newCam = {
            id: Math.random().toString(36).substr(2, 9),
            area: areaName,
            type: 'Bullet',
            resolution: '4MP',
            qty: 1
        };
        setCameras([...cameras, newCam]);
    };

    const removeCamera = (id) => setCameras(cameras.filter(c => c.id !== id));
    const updateCamera = (id, field, value) => setCameras(cameras.map(c => c.id === id ? { ...c, [field]: value } : c));

    // Render Logic based on Mode
    if (mode === 'camera_planning') {
        const areas = data.monitorAreas || ['Perimeter', 'Entrance']; // Fallback if no areas selected in prev step

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-800 mb-6">
                        <Video size={24} />
                        <div>
                            <h3 className="font-bold">Camera Planning</h3>
                            <p className="text-xs opacity-80">Configure cameras for each monitored area.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Recorder Selection */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Settings size={16} /> Recorder (NVR/DVR) Setup</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Channels</label>
                                    <div className="flex gap-2">
                                        {[4, 8, 16, 32].map(ch => (
                                            <button
                                                key={ch}
                                                onClick={() => updateData({ recorderChannels: ch })}
                                                className={clsx(
                                                    "flex-1 py-2 border rounded-lg text-sm font-medium transition-colors",
                                                    data.recorderChannels === ch ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {ch}ch
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Storage (HDD)</label>
                                    <select
                                        value={data.storageTB || ''}
                                        onChange={(e) => updateData({ storageTB: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    >
                                        <option value="">Select Capacity...</option>
                                        <option value="1TB">1TB (Basic)</option>
                                        <option value="2TB">2TB (Standard)</option>
                                        <option value="4TB">4TB (Extended)</option>
                                        <option value="8TB">8TB (Max)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Camera Config Per Area */}
                        <div className="space-y-4">
                            {areas.map(area => (
                                <div key={area} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-bold text-slate-700">{area}</h4>
                                        <button onClick={() => addCamera(area)} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-premium-blue-50 text-slate-600 transition-colors">
                                            + Add Camera
                                        </button>
                                    </div>
                                    <div className="p-4 space-y-3 bg-white">
                                        {cameras.filter(c => c.area === area).length === 0 && (
                                            <p className="text-xs text-slate-400 italic text-center py-2">No cameras configured for this area.</p>
                                        )}
                                        {cameras.filter(c => c.area === area).map(cam => (
                                            <div key={cam.id} className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <select
                                                    value={cam.type}
                                                    onChange={(e) => updateCamera(cam.id, 'type', e.target.value)}
                                                    className="text-sm border-slate-200 rounded p-1 bg-white"
                                                >
                                                    <option value="Bullet">Bullet (Outdoor)</option>
                                                    <option value="Dome">Dome (Indoor)</option>
                                                    <option value="PTZ">PTZ (360° Zoom)</option>
                                                    <option value="Fisheye">Fisheye (Panoramic)</option>
                                                </select>

                                                <select
                                                    value={cam.resolution}
                                                    onChange={(e) => updateCamera(cam.id, 'resolution', e.target.value)}
                                                    className="text-sm border-slate-200 rounded p-1 bg-white"
                                                >
                                                    <option value="2MP">2MP (1080p)</option>
                                                    <option value="4MP">4MP (2K)</option>
                                                    <option value="5MP">5MP (High Res)</option>
                                                    <option value="8MP">8MP (4K)</option>
                                                </select>

                                                <div className="flex items-center gap-2 ml-2">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cam.audio || false}
                                                            onChange={e => updateCamera(cam.id, 'audio', e.target.checked)}
                                                            className="rounded text-emerald-600"
                                                        />
                                                        <span className="text-[10px] text-slate-500">Audio?</span>
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cam.colorNight || false}
                                                            onChange={e => updateCamera(cam.id, 'colorNight', e.target.checked)}
                                                            className="rounded text-emerald-600"
                                                        />
                                                        <span className="text-[10px] text-slate-500">Color Night?</span>
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 ml-auto">
                                                    <span className="text-xs text-slate-400">Qty</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={cam.qty}
                                                        onChange={(e) => updateCamera(cam.id, 'qty', parseInt(e.target.value) || 1)}
                                                        className="w-10 text-center text-sm p-1 outline-none"
                                                    />
                                                </div>

                                                <button onClick={() => removeCamera(cam.id)} className="text-red-400 hover:text-red-600 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Common List Render for Standard/Simplified/Industrial
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

                {/* Wiring Specific Header Inputs */}
                {isWiring && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap items-center gap-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-200 shadow-sm">
                                <Factory size={18} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Room Count</label>
                                <input
                                    type="number"
                                    className="w-20 font-bold text-slate-900 border-b border-slate-300 focus:border-blue-500 outline-none bg-transparent text-sm py-1"
                                    value={data.roomCount || ''}
                                    onChange={e => updateData({ roomCount: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-200 shadow-sm">
                                <Zap size={18} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Phase Type</label>
                                <div className="flex gap-2 mt-1">
                                    {['Single Phase', 'Three Phase'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => updateData({ phaseType: p })}
                                            className={clsx(
                                                "text-[10px] px-2 py-1 rounded border transition-colors font-medium uppercas",
                                                data.phaseType === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mode Specific Stats / Header */}
                {mode === 'standard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-premium-blue-900 to-premium-blue-800 rounded-xl p-4 text-white shadow-md">
                            <div className="flex items-center gap-2 mb-1 opacity-80">
                                <Zap size={16} />
                                <h4 className="text-xs font-medium uppercase tracking-wider">Total Load</h4>
                            </div>
                            <div className="text-2xl font-bold">{(totalLoad / 1000).toFixed(2)} <span className="text-sm font-normal opacity-70">kW</span></div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-800">
                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                <BatteryCharging size={16} />
                                <h4 className="text-xs font-medium uppercase tracking-wider">Daily Energy</h4>
                            </div>
                            <div className="text-2xl font-bold text-premium-blue-900">{(totalDailyEnergy / 1000).toFixed(1)} <span className="text-sm font-normal opacity-50">kWh</span></div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-800">
                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                <Monitor size={16} />
                                <h4 className="text-xs font-medium uppercase tracking-wider">Critical Load</h4>
                            </div>
                            <div className="text-2xl font-bold text-amber-600">{(criticalLoad / 1000).toFixed(2)} <span className="text-sm font-normal opacity-50">kW</span></div>
                        </div>
                    </div>
                )}

                {(mode === 'simplified' || mode === 'industrial_load') && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between mb-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={clsx("p-2 rounded-lg", mode === 'industrial_load' ? "bg-slate-200 text-slate-700" : "bg-blue-100 text-blue-600")}>
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Total Connected Load</h3>
                                <p className="text-xs text-slate-500">{mode === 'industrial_load' ? 'Detailed machine inventory' : 'Simple appliance count'}</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">
                            {(totalLoad / 1000).toFixed(2)} <span className="text-sm text-slate-500 font-normal">kW</span>
                        </div>
                    </div>
                )}

                {/* Unified Item List Table */}
                <div className="border border-slate-100 rounded-xl overflow-hidden mb-6">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-[10px] uppercase flex items-center">
                        <div className="flex-[2] pl-2">{mode === 'industrial_load' ? 'Machine Name' : 'Appliance'}</div>
                        <div className="flex-1 text-center">Watts</div>
                        <div className="flex-1 text-center">Qty</div>
                        {mode !== 'simplified' && <div className="flex-1 text-center">Hours</div>}
                        {(mode === 'standard' || mode === 'industrial_load') && <div className="flex-1 text-center">Crit?</div>}
                        <div className="w-10"></div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {items.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic bg-white">
                                No items added yet.
                            </div>
                        )}
                        {items.map(item => (
                            <div key={item.id} className="p-2 flex items-center gap-2 hover:bg-slate-50 transition-colors group bg-white">
                                <div className="flex-[2] min-w-0">
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                        className="w-full font-medium text-slate-700 bg-transparent outline-none text-sm placeholder:text-slate-300"
                                        placeholder="Item name"
                                    />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <input
                                        type="number"
                                        value={item.power}
                                        onChange={(e) => updateItem(item.id, 'power', parseFloat(e.target.value) || 0)}
                                        className="w-14 text-center bg-slate-100 rounded py-1 text-xs font-bold text-slate-600"
                                    />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="flex items-center border border-slate-200 rounded bg-white">
                                        <button onClick={() => updateItem(item.id, 'qty', Math.max(1, item.qty - 1))} className="w-5 py-0.5 hover:bg-slate-100 text-slate-400">-</button>
                                        <span className="w-6 text-center text-xs font-medium">{item.qty}</span>
                                        <button onClick={() => updateItem(item.id, 'qty', item.qty + 1)} className="w-5 py-0.5 hover:bg-slate-100 text-slate-600">+</button>
                                    </div>
                                </div>

                                {mode !== 'simplified' && (
                                    <div className="flex-1 flex justify-center">
                                        <input
                                            type="number"
                                            value={item.hours}
                                            onChange={(e) => updateItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                                            className="w-10 text-center bg-transparent border-b border-slate-200 focus:border-premium-blue-500 outline-none text-xs"
                                        />
                                    </div>
                                )}

                                {(mode === 'standard' || mode === 'industrial_load') && (
                                    <div className="flex-1 flex justify-center">
                                        <input
                                            type="checkbox"
                                            checked={item.critical}
                                            onChange={(e) => updateItem(item.id, 'critical', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                        />
                                    </div>
                                )}

                                <div className="w-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Add Section */}
                {mode !== 'industrial_load' && (
                    <div>
                        <h5 className="font-bold text-slate-700 text-sm mb-3">Quick Add</h5>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {APPLIANCE_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => addItem(preset)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-premium-blue-300 hover:bg-premium-blue-50 hover:text-premium-blue-700 text-xs font-medium text-slate-600 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={12} /> {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Add Footer */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Custom Item</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-premium-blue-500 outline-none"
                            placeholder={mode === 'industrial_load' ? "e.g. Injection Molder" : "e.g. Industrial Printer"}
                        />
                    </div>
                    <div className="w-24">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Watts</label>
                        <input
                            type="number"
                            value={customPower}
                            onChange={(e) => setCustomPower(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-premium-blue-500 outline-none"
                            placeholder="0"
                        />
                    </div>
                    <button
                        onClick={addCustomItem}
                        disabled={!customName || !customPower}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
