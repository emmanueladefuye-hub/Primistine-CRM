import React, { useState, useEffect } from 'react';
import { Camera, Compass, ArrowUp, AlertCircle, Check, X, Video, Zap, ShieldAlert, Settings, Factory, ShieldCheck, Construction, Locate, Navigation2, Ruler, CloudSun, Wind, Droplets, Loader2, ClipboardList, MapPin, Plus, Info, Home } from 'lucide-react';
import clsx from 'clsx';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useDeviceOrientation } from '../../../hooks/useDeviceOrientation';

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../../lib/firebase';

export default function SiteAssessment({ data, updateData, onNext, services = [], showToast }) {
    const [photos, setPhotos] = useState(data.photos || []);
    const [isUploading, setIsUploading] = useState(false);
    const { location } = useGeolocation();
    const { orientation, requestPermission, isPermissionsRequired } = useDeviceOrientation();

    const handleChange = (field, value) => {
        updateData({ [field]: value });
    };

    // Auto-populate GPS if available and not set
    useEffect(() => {
        if (location && !data.gps) {
            handleChange('gps', `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (Auto-captured)`);
        }
    }, [location, data.gps]);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const user = auth.currentUser;
        if (!user) {
            if (showToast) showToast("Authentication required. Please sign in.", 'error');
            return;
        }

        setIsUploading(true);
        if (showToast) showToast("Starting upload...", 'info');

        try {

            // Path must match storage.rules
            const storageRef = ref(storage, `site_photos/audits/${data.id || 'temp_audit'}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {
                    console.error("Firebase Storage Upload Error:", error);
                    setIsUploading(false);
                    let errMsg = "Upload failed";
                    if (error.code === 'storage/unauthorized') {
                        errMsg = "Permission denied. Ensure your role is set in Firestore.";
                    }
                    if (showToast) showToast(errMsg, 'error');
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {


                        const id = Math.random().toString(36).substr(2, 9);
                        const newPhoto = {
                            id,
                            url: downloadURL,
                            timestamp: new Date().toISOString(),
                            metadata: location ? {
                                lat: location.latitude,
                                lng: location.longitude,
                            } : null
                        };

                        const updatedPhotos = [...photos, newPhoto];
                        setPhotos(updatedPhotos);
                        handleChange('photos', updatedPhotos);

                        setIsUploading(false);
                        if (showToast) showToast("Photo added!", 'success');
                    }).catch(err => {
                        console.error("Error getting download URL:", err);
                        setIsUploading(false);
                    });
                }
            );

        } catch (error) {
            console.error("Upload error:", error);
            setIsUploading(false);
            if (showToast) showToast("Upload failed", 'error');
        } finally {
            e.target.value = null; // Reset input
        }
    };

    const removePhoto = (photoId) => {
        const updated = photos.filter(p => p.id !== photoId);
        setPhotos(updated);
        handleChange('photos', updated);
    };

    const isSolar = services.includes('solar');
    const isCCTV = services.includes('cctv');
    const isWiring = services.includes('wiring');
    const isGenerator = services.includes('generator');
    const isEarthing = services.includes('earthing');
    const isIndustrial = services.includes('industrial');

    const [weather, setWeather] = useState(null);
    const [rangeLoading, setRangeLoading] = useState(false);

    // Mock Weather Fetch
    useEffect(() => {
        if (location && !weather) {
            setWeather({
                temp: 31,
                condition: 'Partly Cloudy',
                humidity: 65,
                wind: 12
            });
        }
    }, [location]);

    const handleRangeCapture = (field) => {
        setRangeLoading(true);
        setTimeout(() => {
            const mockDistance = (Math.random() * 5 + 2).toFixed(2);
            handleChange(field, mockDistance);
            setRangeLoading(false);
        }, 1200);
    };

    // CCTV Specific Data Handlers
    const toggleArea = (area) => {
        const currentAreas = data.monitorAreas || [];
        const newAreas = currentAreas.includes(area)
            ? currentAreas.filter(a => a !== area)
            : [...currentAreas, area];
        handleChange('monitorAreas', newAreas);
    };

    const toggleConcern = (concern) => {
        const currentConcerns = data.securityConcerns || [];
        const newConcerns = currentConcerns.includes(concern)
            ? currentConcerns.filter(c => c !== concern)
            : [...currentConcerns, concern];
        handleChange('securityConcerns', newConcerns);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">



            {/* Quick Tools Data Verification */}
            {(data.notes?.length > 0 || data.videos?.length > 0 || data.voiceNotes?.length > 0) && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <ClipboardList size={20} className="text-slate-600" />
                        Captured Data & Notes
                    </h3>

                    <div className="space-y-6">
                        {/* Quick Notes */}
                        {data.notes?.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Quick Notes</label>
                                {data.notes.map((note, idx) => (
                                    <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-slate-700">
                                        <p>{note.text}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">{new Date(note.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Videos */}
                        {data.videos?.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Videos</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {data.videos.map((vid, idx) => (
                                        <video key={idx} src={vid} controls className="w-full rounded-lg border border-slate-200 bg-black" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Voice Notes */}
                        {data.voiceNotes?.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Voice Notes</label>
                                <div className="space-y-2">
                                    {data.voiceNotes.map((audio, idx) => (
                                        <audio key={idx} src={audio} controls className="w-full" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Building Dimensions (Wiring/Industrial ONLY) */}
            {(isWiring || isIndustrial) && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Home size={20} className="text-slate-600" />
                        Building Dimensions & Age
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Total Floor Area (m²)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="flex-1 p-3 rounded-xl border border-slate-200"
                                    placeholder="e.g. 250"
                                    value={data.floorArea || ''}
                                    onChange={(e) => handleChange('floorArea', e.target.value)}
                                />
                                <button
                                    onClick={() => handleRangeCapture('floorArea')}
                                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                                    title="Capture from Rangefinder"
                                >
                                    <Ruler size={20} className={rangeLoading ? "animate-pulse" : ""} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Building Age (Years)</label>
                            <input
                                type="number"
                                className="w-full p-3 rounded-xl border border-slate-200"
                                placeholder="e.g. 15"
                                value={data.buildingAge || ''}
                                onChange={(e) => handleChange('buildingAge', e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Industrial Facility Overview (Industrial Only) */}
            {isIndustrial && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Factory size={20} className="text-slate-600" />
                        Industrial Facility Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Facility Type</label>
                            <select
                                className="w-full p-3 rounded-xl border border-slate-200"
                                value={data.facilityType || ''}
                                onChange={(e) => handleChange('facilityType', e.target.value)}
                            >
                                <option value="">Select...</option>
                                <option value="Manufacturing">Manufacturing Plant</option>
                                <option value="Processing">Processing Facility</option>
                                <option value="Warehouse">Warehouse / Logistics</option>
                                <option value="DataCenter">Data Center</option>
                                <option value="Textile">Textile / Garment</option>
                                <option value="Chemical">Chemical / Pharma</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Occupants / Employees</label>
                            <input
                                type="number"
                                className="w-full p-3 rounded-xl border border-slate-200"
                                placeholder="Number of people"
                                value={data.occupants || ''}
                                onChange={(e) => handleChange('occupants', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Shift Pattern</label>
                            <div className="flex gap-2">
                                {['Single Shift', 'Double Shift', '24/7'].map(shift => (
                                    <button
                                        key={shift}
                                        onClick={() => handleChange('shiftPattern', shift)}
                                        className={clsx(
                                            "flex-1 p-2 border rounded-lg text-xs font-medium",
                                            data.shiftPattern === shift ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600"
                                        )}
                                    >
                                        {shift}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Hours Per Day</label>
                            <input
                                type="number"
                                className="w-full p-3 rounded-xl border border-slate-200"
                                placeholder="e.g. 12"
                                value={data.hoursPerDay || ''}
                                onChange={(e) => handleChange('hoursPerDay', e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Industrial Safety Hazards (Industrial Only) */}
            {isIndustrial && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-red-100">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                        <ShieldAlert size={20} className="text-red-500" />
                        Safety Hazards Identification
                    </h3>

                    <div className="space-y-6">
                        {/* Hazard Checklist */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Identified Hazard Categories</label>
                            <div className="flex flex-wrap gap-2">
                                {['Electrical Shock', 'Fire Risk', 'Chemical Exposure', 'Trip/Slip', 'Flying Debris', 'Noise High', 'Poor Ventilation', 'Moving Machinery'].map(hazard => (
                                    <label key={hazard} className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all",
                                        (data.hazardTypes || []).includes(hazard)
                                            ? "bg-red-50 border-red-500 text-red-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={(data.hazardTypes || []).includes(hazard)}
                                            onChange={(e) => {
                                                const current = data.hazardTypes || [];
                                                handleChange('hazardTypes', e.target.checked ? [...current, hazard] : current.filter(h => h !== hazard));
                                            }}
                                        />
                                        {hazard}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Critical Hazard Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Critical Hazard Notes</label>
                            <textarea
                                className="w-full p-3 rounded-xl border border-slate-200 bg-red-50 text-sm h-24 resize-none focus:ring-red-500 focus:border-red-500"
                                placeholder="Describe any immediate threats to safety (e.g., exposed high voltage busbars, sparking equipment)..."
                                value={data.hazardNotes || ''}
                                onChange={(e) => handleChange('hazardNotes', e.target.value)}
                            />
                        </div>

                        {/* Simple Hazard Log Helper */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 text-sm mb-2">Specific Hazard Locations</h4>
                            <div className="space-y-2">
                                {(data.hazardsList || []).map((h, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm">
                                        <span className="font-medium">{h.location} - {h.type}</span>
                                        <button
                                            onClick={() => handleChange('hazardsList', data.hazardsList.filter((_, i) => i !== idx))}
                                            className="text-red-500 p-1 hover:bg-red-50 rounded"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                    <input
                                        id="newHazardLoc"
                                        type="text"
                                        placeholder="Location (e.g. Machine Hall A)"
                                        className="flex-1 p-2 rounded border border-slate-300 text-xs"
                                    />
                                    <select id="newHazardType" className="p-2 rounded border border-slate-300 text-xs">
                                        <option value="Electrical">Electrical</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Chemical">Chemical</option>
                                        <option value="Fire">Fire</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            const loc = document.getElementById('newHazardLoc').value;
                                            const type = document.getElementById('newHazardType').value;
                                            if (loc) {
                                                handleChange('hazardsList', [...(data.hazardsList || []), { location: loc, type }]);
                                                document.getElementById('newHazardLoc').value = '';
                                            }
                                        }}
                                        className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-bold"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            )}






            {/* Roof Assessment (For Solar) */}
            {isSolar && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-premium-blue-900 flex items-center gap-2">
                            <ArrowUp size={20} className="text-orange-500" />
                            Roof Assessment
                        </h3>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">Solar Critical</span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Roof Material</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Concrete', 'Longspan Alum.', 'Stone Coated'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleChange('roofMaterial', type)}
                                        className={clsx(
                                            "h-20 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-2 transition-all",
                                            data.roofMaterial === type
                                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {/* Placeholder Squares */}
                                        <div className={clsx("w-6 h-6 rounded", type === 'Concrete' ? "bg-slate-400" : type.includes('Stone') ? "bg-slate-800" : "bg-blue-300")}></div>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Compass Widget Placeholder */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-medium text-slate-300 mb-1">Compass & Orientation</h4>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center relative bg-slate-800">
                                        <div
                                            className="transition-transform duration-200 ease-out"
                                            style={{ transform: `rotate(${orientation.alpha || 0}deg)` }}
                                        >
                                            <Navigation2 size={32} className="text-orange-400" />
                                        </div>
                                        <div className="absolute -top-1 text-[10px] font-bold text-slate-400">N</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                                            {Math.round(orientation.alpha || 185)}° {orientation.alpha ? (orientation.alpha < 45 || orientation.alpha > 315 ? 'N' : orientation.alpha < 135 ? 'E' : orientation.alpha < 225 ? 'S' : 'W') : 'S'}
                                            {data.capturedOrientation && <CheckCircle2 size={20} className="text-green-500" />}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {isPermissionsRequired ? (
                                                <button
                                                    onClick={requestPermission}
                                                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1 w-fit mt-1"
                                                >
                                                    <Locate size={12} />
                                                    Enable Sensors
                                                </button>
                                            ) : (
                                                <div className="text-[10px] font-bold text-green-400 flex items-center gap-1 uppercase tracking-tight">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                    Live Sensor Active
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => {
                                                        handleChange('capturedOrientation', Math.round(orientation.alpha || 0));
                                                        handleChange('capturedTilt', Math.round(Math.abs(orientation.beta - 90) || 0));
                                                        if (showToast) showToast("Orientation Captured!", 'success');
                                                    }}
                                                    className="px-4 py-1.5 bg-premium-blue-500 hover:bg-premium-blue-600 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-premium-blue-500/20"
                                                >
                                                    <Locate size={14} />
                                                    Capture Reading
                                                </button>
                                                {data.capturedOrientation && (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
                                                        Stored: {data.capturedOrientation}°
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 relative">
                                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Roof Tilt Angle</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-4 bg-slate-700 rounded-sm relative overflow-hidden">
                                                <div
                                                    className="absolute inset-0 bg-orange-500/40"
                                                    style={{ transform: `skewY(${-(orientation.beta - 90) || 0}deg)` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-lg">{Math.round(Math.abs(orientation.beta - 90) || 30)}°</span>
                                        </div>
                                        {data.capturedTilt && (
                                            <div className="absolute top-1 right-2 text-[8px] font-bold text-green-500 uppercase">
                                                Captured: {data.capturedTilt}°
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Lagos Optimal</label>
                                        <span className="font-bold text-lg text-green-400">15° - 20°</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <label className="text-xs text-slate-400 mb-2 block">Shading Obstructions?</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Trees', 'Buildings', 'Tanks', 'Sat. Dish', 'None'].map(obs => (
                                            <button
                                                key={obs}
                                                onClick={() => {
                                                    const current = data.obstructions || [];
                                                    if (current.includes(obs)) handleChange('obstructions', current.filter(x => x !== obs));
                                                    else handleChange('obstructions', [...current, obs]);
                                                }}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                                                    (data.obstructions || []).includes(obs)
                                                        ? "bg-orange-500 border-orange-500 text-white"
                                                        : "bg-transparent border-slate-600 text-slate-300 hover:border-slate-400"
                                                )}
                                            >
                                                {obs}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3 relative z-10">
                                <Info size={16} className="text-premium-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    <strong className="text-slate-200 uppercase tracking-widest text-[9px] block mb-0.5">Auditor Tip</strong>
                                    For best results on field audits, ensure the device is held flat (for compass) or against the roof surface (for tilt) before clicking "Capture Reading".
                                </p>
                            </div>

                            {/* Decorative BG */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full"></div>
                        </div>
                    </div>
                </section>
            )}


            {/* Security Assessment (CCTV ONLY - REFINED) */}
            {isCCTV && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-emerald-100">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Video size={20} className="text-emerald-500" />
                        Security & Surveillance Details
                    </h3>
                    <div className="space-y-6">

                        {/* Risk Level */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Risk Level *</label>
                            <div className="flex gap-2">
                                {['Low', 'Medium', 'High'].map(risk => (
                                    <button
                                        key={risk}
                                        onClick={() => handleChange('riskLevel', risk)}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                                            data.riskLevel === risk
                                                ? (risk === 'High' ? "bg-red-50 border-red-500 text-red-700" : risk === 'Medium' ? "bg-yellow-50 border-yellow-500 text-yellow-700" : "bg-emerald-50 border-emerald-500 text-emerald-700")
                                                : "bg-white border-slate-200 text-slate-600"
                                        )}
                                    >
                                        {risk}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Threats */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Primary Threats (Select all that apply)</label>
                            <div className="flex flex-wrap gap-2">
                                {['Theft', 'Vandalism', 'Staff Monitoring', 'Vehicle Tracking', 'Intrusion', 'Evidence', 'Perimeter Breach'].map(concern => (
                                    <button
                                        key={concern}
                                        onClick={() => toggleConcern(concern)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                            (data.securityConcerns || []).includes(concern)
                                                ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {concern}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Critical Areas */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Critical Areas to Monitor</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Perimeter', 'Main Entrance', 'Back Gate', 'Parking Lot', 'Reception', 'Corridors', 'Cash Point', 'Server Room', 'Warehouse Floor', 'Loading Bay'].map(area => (
                                    <label key={area} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            className="rounded text-emerald-500 focus:ring-emerald-500"
                                            checked={(data.monitorAreas || []).includes(area)}
                                            onChange={() => toggleArea(area)}
                                        />
                                        <span className="text-xs text-slate-700">{area}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Existing System Check */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.hasExistingCCTV || false}
                                    onChange={(e) => handleChange('hasExistingCCTV', e.target.checked)}
                                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-medium text-slate-700">Is there an existing CCTV System?</span>
                            </label>

                            {data.hasExistingCCTV && (
                                <div className="mt-3 pl-8 text-sm space-y-3">
                                    <div>
                                        <label className="block text-slate-500 text-xs uppercase font-bold mb-1">Condition</label>
                                        <select
                                            value={data.cctvCondition || ''}
                                            onChange={e => handleChange('cctvCondition', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Working Perfect">Working Perfectly</option>
                                            <option value="Needs Upgrade">Needs Upgrade</option>
                                            <option value="Non-Functional">Non-Functional</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs uppercase font-bold mb-1">System Type</label>
                                        <div className="flex gap-4">
                                            {['Analog (BNC)', 'IP (Cat6)', 'WiFi'].map(type => (
                                                <label key={type} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="cctvType"
                                                        value={type}
                                                        checked={data.existingCCTVType === type}
                                                        onChange={() => handleChange('existingCCTVType', type)}
                                                        className="text-emerald-600"
                                                    />
                                                    <span className="text-slate-600">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Infrastructure & Network */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Recorder Location</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                                    placeholder="e.g. Master Bedroom, Server Room"
                                    value={data.recorderLocation || ''}
                                    onChange={(e) => handleChange('recorderLocation', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Internet for Remote View?</label>
                                <div className="flex gap-2">
                                    {['Yes - WiFi Available', 'Yes - LAN Available', 'No Internet'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleChange('cctvNetwork', opt)}
                                            className={clsx(
                                                "flex-1 p-2 border rounded-lg text-xs font-medium text-center",
                                                data.cctvNetwork === opt ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white text-slate-600"
                                            )}
                                        >
                                            {opt.split(' ')[0]} {/* Show partial text for compactness if needed, or full */}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Blind Spots Note */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Noted Blind Spots / Obstructions</label>
                            <textarea
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm h-20 resize-none"
                                placeholder="e.g. Large mango tree blocking front gate view..."
                                value={data.blindSpots || ''}
                                onChange={(e) => handleChange('blindSpots', e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Wiring Assessment Details (WIRING ONLY) */}
            {isWiring && (
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-blue-100">
                    <h3 className="text-lg font-bold text-premium-blue-900 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-blue-500" />
                        Wiring & Conduits Assessment
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Internal Wiring Standard</label>
                            <div className="flex gap-2">
                                {['Excellent', 'Good', 'Fair', 'Poor'].map(std => (
                                    <button
                                        key={std}
                                        onClick={() => handleChange('wiringStandard', std)}
                                        className={clsx(
                                            "flex-1 p-2 border rounded-lg text-xs font-medium transition-colors",
                                            data.wiringStandard === std
                                                ? (std === 'Poor' ? "bg-red-50 border-red-500 text-red-700" : "bg-blue-50 border-blue-500 text-blue-700")
                                                : "bg-white text-slate-600"
                                        )}
                                    >
                                        {std}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Common Issues (Observed)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Exposed Cables', 'Burnt Sockets', 'Loose Connections', 'Dimming Lights', 'Tripping Breakers', 'Old fuse box'].map(issue => (
                                    <label key={issue} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                const issues = data.wiringIssues || [];
                                                if (e.target.checked) handleChange('wiringIssues', [...issues, issue]);
                                                else handleChange('wiringIssues', issues.filter(i => i !== issue));
                                            }}
                                            checked={(data.wiringIssues || []).includes(issue)}
                                        />
                                        <span className="text-xs text-slate-700">{issue}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Access & Logistics */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-premium-blue-900 mb-4">Access & Logistics</h3>
                <div className="space-y-3">
                    {[
                        { id: 'vehicle', label: 'Vehicle access to site' },
                        { id: 'ladder', label: 'Ladder access to roof' },
                        { id: 'hours', label: 'Restricted working hours' },
                    ].map(item => (
                        <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-premium-blue-600 focus:ring-premium-blue-500"
                                checked={data[item.id] || false}
                                onChange={(e) => handleChange(item.id, e.target.checked)}
                            />
                            <span className="text-slate-700 font-medium">{item.label}</span>
                        </label>
                    ))}
                </div>
            </section>

        </div>
    );
}
