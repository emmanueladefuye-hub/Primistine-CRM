import React, { useState } from 'react';
import { MapPin, User, Phone, Mail, Home, Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../../lib/firebase';

export default function ClientProjectInfo({ data, updateData, onNext, showToast, hideNavigation }) {
    const [touched, setTouched] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const { location, loading: gpsLoading } = useGeolocation();

    // Universal Form Fields Checklist
    // [x] clientName, phone, email
    // [x] address (GPS), buildingType, ownership, structure
    // [x] auditDate, engineerName (auto)
    // [x] sitePhotos (min 2)

    const handleChange = (field, value) => {
        updateData({ ...data, [field]: value });
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleGPS = () => {
        if (location) {
            // Check if location has coords (native) or is flattened (custom hook)
            const lat = location.coords ? location.coords.latitude : location.latitude;
            const lng = location.coords ? location.coords.longitude : location.longitude;

            if (lat && lng) {
                handleChange('gps', `${lat}, ${lng}`);
                handleChange('address', `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
        }
    };

    const validatePhone = (phone) => {
        // Nigerian phone regex: +234 or 0 followed by 7/8/9 and 8 digits
        const regex = /^(\+?234|0)[789][01]\d{8}$/;
        return regex.test(phone.replace(/\s/g, ''));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const user = auth.currentUser;


        if (!user) {
            if (showToast) showToast("Authentication required for upload. Please sign in.", 'error');
            return;
        }

        setIsUploading(true);
        if (showToast) showToast("Starting upload...", 'info');

        try {

            // Path must match storage.rules (starts with site_photos/)
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
                        errMsg = "Permission denied. Ensure your user role (Engineer/Admin) is set in Firestore.";
                    } else if (error.code === 'storage/canceled') {
                        errMsg = "Upload canceled.";
                    }
                    if (showToast) showToast(errMsg, 'error');
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {


                        const newPhoto = {
                            id: Date.now().toString(),
                            url: downloadURL,
                            timestamp: new Date().toISOString(),
                        };

                        const currentPhotos = data.photos || [];
                        handleChange('photos', [...currentPhotos, newPhoto]);

                        setIsUploading(false);
                        if (showToast) showToast("Photo uploaded successfully!", 'success');
                    }).catch(err => {
                        console.error("Error getting download URL:", err);
                        setIsUploading(false);
                        if (showToast) showToast("Failed to get image link", 'error');
                    });
                }
            );

        } catch (error) {
            console.error("Upload initialization error:", error);
            setIsUploading(false);
            if (showToast) showToast("Failed to start upload", 'error');
        } finally {
            e.target.value = null;
        }
    };

    const removePhoto = (index) => {
        const currentPhotos = data.photos || [];
        handleChange('photos', currentPhotos.filter((_, i) => i !== index));
    };

    // Validation Logic
    const errors = {};
    if (!data.clientName) errors.clientName = "Client Name is required";
    if (!data.phone) errors.phone = "Phone Number is required";
    else if (!validatePhone(data.phone)) errors.phone = "Invalid Nigerian phone number";
    if (!data.address) errors.address = "Site Address is required";
    if (!data.buildingType) errors.buildingType = "Building Type is required";
    if (!data.ownership) errors.ownership = "Ownership status is required";
    if (!data.structure) errors.structure = "Building Structure is required";
    // if (!data.photos || data.photos.length < 2) errors.photos = "At least 2 site photos are required";

    const isValid = Object.keys(errors).length === 0;

    const handleSubmit = () => {
        setTouched({
            clientName: true, phone: true, address: true,
            buildingType: true, ownership: true, structure: true, photos: true
        });

        if (isValid) {
            // Auto-fill context data
            updateData({
                ...data,
                auditDate: new Date().toISOString(),
                engineerName: 'Current User' // Replace with auth user later
            });
            onNext();
        } else {
            // Scroll to error?
            if (showToast) showToast("Please fix the errors before continuing.", 'error');
            else alert("Please fix the errors before continuing.");
        }
    };

    // Helper to get URL string from photo object or string
    const getPhotoUrl = (p) => typeof p === 'string' ? p : p.url;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Removed as per streamlining request */}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">

                {/* Section 1: Client Details */}
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <User size={18} className="text-premium-blue-600" /> Client Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.clientName || ''}
                                onChange={e => handleChange('clientName', e.target.value)}
                                onBlur={() => handleBlur('clientName')}
                                className={clsx("w-full p-3 rounded-xl border pl-10",
                                    touched.clientName && errors.clientName ? "border-red-300 bg-red-50" : "border-slate-200"
                                )}
                                placeholder="e.g. Mr. Adebayo Johnson"
                            />
                            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                        {touched.clientName && errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={data.phone || ''}
                                onChange={e => handleChange('phone', e.target.value)}
                                onBlur={() => handleBlur('phone')}
                                className={clsx("w-full p-3 rounded-xl border pl-10",
                                    touched.phone && errors.phone ? "border-red-300 bg-red-50" : "border-slate-200"
                                )}
                                placeholder="080..."
                            />
                            <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                        {touched.phone && errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address (Optional)</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={data.email || ''}
                                onChange={e => handleChange('email', e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 pl-10"
                                placeholder="client@example.com"
                            />
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Property Details */}
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 pt-4">
                    <Home size={18} className="text-premium-blue-600" /> Property Details
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Site Address *</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={data.address || ''}
                                onChange={e => handleChange('address', e.target.value)}
                                onBlur={() => handleBlur('address')}
                                className={clsx("w-full p-3 rounded-xl border pl-10",
                                    touched.address && errors.address ? "border-red-300 bg-red-50" : "border-slate-200"
                                )}
                                placeholder="Full street address..."
                            />
                            <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                        <button
                            type="button"
                            onClick={handleGPS}
                            className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 border border-slate-200 transition-colors"
                            title="Use GPS Location"
                        >
                            {gpsLoading ? <span className="animate-spin">🔄</span> : <MapPin size={20} />}
                        </button>
                    </div>
                    {data.gps && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> GPS Captured: {data.gps}</p>}
                    {touched.address && errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Building Type *</label>
                        <select
                            value={data.buildingType || ''}
                            onChange={e => handleChange('buildingType', e.target.value)}
                            onBlur={() => handleBlur('buildingType')}
                            className={clsx("w-full p-3 rounded-xl border",
                                touched.buildingType && errors.buildingType ? "border-red-300" : "border-slate-200"
                            )}
                        >
                            <option value="">Select...</option>
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                        </select>
                        {touched.buildingType && errors.buildingType && <p className="text-xs text-red-500 mt-1">{errors.buildingType}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ownership *</label>
                        <select
                            value={data.ownership || ''}
                            onChange={e => handleChange('ownership', e.target.value)}
                            onBlur={() => handleBlur('ownership')}
                            className={clsx("w-full p-3 rounded-xl border",
                                touched.ownership && errors.ownership ? "border-red-300" : "border-slate-200"
                            )}
                        >
                            <option value="">Select...</option>
                            <option value="Owned">Owner-Occupied</option>
                            <option value="Rented">Rented/Leased</option>
                            <option value="Construction">Under Construction</option>
                        </select>
                        {touched.ownership && errors.ownership && <p className="text-xs text-red-500 mt-1">{errors.ownership}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Structure *</label>
                        <select
                            value={data.structure || ''}
                            onChange={e => handleChange('structure', e.target.value)}
                            onBlur={() => handleBlur('structure')}
                            className={clsx("w-full p-3 rounded-xl border",
                                touched.structure && errors.structure ? "border-red-300" : "border-slate-200"
                            )}
                        >
                            <option value="">Select...</option>
                            <option value="Bungalow">Bungalow</option>
                            <option value="Duplex">Duplex</option>
                            <option value="Terrace">Terrace</option>
                            <option value="Storey">Storey Building</option>
                            <option value="Warehouse">Warehouse</option>
                            <option value="Complex">Office Complex</option>
                        </select>
                        {touched.structure && errors.structure && <p className="text-xs text-red-500 mt-1">{errors.structure}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Number of Floors</label>
                        <div className="flex bg-slate-100 rounded-xl p-1 h-[46px]">
                            {[1, 2, 3, 4, '5+'].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleChange('floors', num)}
                                    className={clsx(
                                        "flex-1 rounded-lg text-xs font-bold transition-all",
                                        data.floors === num ? "bg-white text-premium-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section 3: Site Photos */}
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 pt-4">
                    <Camera size={18} className="text-premium-blue-600" /> Site Photos
                </h3>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                        <Camera className="text-slate-400" size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-900">Upload Site Photos</p>
                    <p className="text-xs text-slate-500">Exterior, Meter, Gate, etc. (Optional)</p>

                    {/* Photo List */}
                    <div className="mt-4 flex gap-2 justify-center flex-wrap">
                        {(data.photos || []).map((p, i) => (
                            <div key={i} className="w-16 h-16 bg-slate-200 rounded-lg bg-cover bg-center relative group" style={{ backgroundImage: `url(${getPhotoUrl(p)})` }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >×</button>
                            </div>
                        ))}
                    </div>

                    <label className={clsx(
                        "mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer",
                        isUploading && "opacity-50 pointer-events-none"
                    )}>
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                        {isUploading ? "Uploading..." : "Add Photo"}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
                {touched.photos && errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}

            </div>

            {!hideNavigation && (
                <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-premium-blue-900 text-white rounded-xl font-bold shadow-lg hover:bg-premium-blue-800 transition-all flex items-center justify-center gap-2"
                >
                    Confirm & Continue
                </button>
            )}
        </div>
    );
}

