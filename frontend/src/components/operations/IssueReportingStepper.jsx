import React, { useState } from 'react';
import {
    Camera, X, ChevronRight, ChevronLeft, Mic, Image as ImageIcon,
    MapPin, Clock, AlertTriangle, CheckCircle, Upload
} from 'lucide-react';
import clsx from 'clsx';
import SeverityBadge from '../ui/SeverityBadge';
import { createIssue } from '../../services/issues';

/**
 * Mobile-first Stepper for Issue Reporting
 * Steps: 0: Entry (FAB usually handles this), 1: Photo, 2: Review, 3: Form, 4: Success
 */
export default function IssueReportingStepper({ onCancel }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [photoFiles, setPhotoFiles] = useState([]); // Store actual Files
    const [photoPreviews, setPhotoPreviews] = useState([]); // Preview URLs
    const [recording, setRecording] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newIssueId, setNewIssueId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        severity: 'High',
        type: 'Equipment Failure',
        workStopped: true,
        projectContext: 'Project #PRJ-0834', // Mock context
        location: 'Lekki Phase 1',
        reporter: { name: 'Demo User' }
    });

    const nextStep = () => setCurrentStep(curr => Math.min(curr + 1, 4));
    const prevStep = () => setCurrentStep(curr => Math.max(curr - 1, 1));

    // Handle Files
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoFiles(prev => [...prev, ...files]);
        setPhotoPreviews(prev => [...prev, ...newPreviews]);

        if (currentStep === 1) nextStep();
    };

    const removePhoto = (index) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    }

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const docId = await createIssue(formData, photoFiles);
            setNewIssueId(docId);
            nextStep(); // Go to success
        } catch (error) {
            alert('Failed to submit issue: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:max-w-md md:mx-auto md:shadow-2xl md:relative md:h-full md:rounded-xl overflow-hidden">

            {/* HEADER */}
            {currentStep < 4 && (
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <button onClick={prevStep} className="p-1 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full">
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <h2 className="font-bold text-slate-800 text-lg">Report Issue</h2>
                    </div>
                    <button onClick={onCancel} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto bg-slate-50">

                {/* STEP 1: CAPTURE */}
                {currentStep === 1 && (
                    <div className="flex flex-col h-full p-6 text-center justify-center">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
                                <Camera size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Take a Photo</h3>
                            <p className="text-slate-500">Show the problem first. Visuals help us triage faster.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="block w-full">
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                                <div className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform">
                                    <Camera size={24} />
                                    Take Photo
                                </div>
                            </label>

                            <label className="block w-full">
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                                <div className="w-full bg-white text-slate-700 font-bold py-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform">
                                    <ImageIcon size={20} />
                                    Choose from Gallery
                                </div>
                            </label>
                        </div>

                        <button onClick={nextStep} className="mt-8 text-slate-400 font-medium text-sm hover:text-slate-600">
                            Skip photo (Describe only)
                        </button>
                    </div>
                )}

                {/* STEP 2: REVIEW PHOTOS */}
                {currentStep === 2 && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Review Photos ({photoPreviews.length})</h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {photoPreviews.map((src, idx) => (
                                <div key={idx} className="aspect-square bg-slate-200 rounded-xl relative overflow-hidden group">
                                    <img src={src} alt="Issue" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(idx)}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-colors">
                                <PlusIcon />
                                <span className="text-xs font-medium mt-2">Add More</span>
                                <input type="file" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start mb-8">
                            <div className="mt-0.5 text-blue-600"><Camera size={18} /></div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Pro Tip</p>
                                <p className="text-xs text-slate-600 mt-1">Take a wide shot of the area and a close-up of the specific defect.</p>
                            </div>
                        </div>

                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 md:absolute md:w-full">
                            <button onClick={nextStep} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                                Next Step <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: DETAILS FORM */}
                {currentStep === 3 && (
                    <div className="p-6 pb-24">
                        {/* Context Header */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin size={14} className="text-blue-500" />
                                <span className="font-medium text-slate-700">Lekki Phase 1 (GPS)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock size={14} className="text-blue-500" />
                                <span>2:34 PM, Jan 7, 2026</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Voice Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Describe the Issue</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full p-4 pr-12 rounded-xl border border-slate-200 h-32 text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Type or speak..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                    <button
                                        className={clsx(
                                            "absolute right-3 bottom-3 p-2 rounded-full transition-colors",
                                            recording ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                        onClick={() => setRecording(!recording)}
                                    >
                                        <Mic size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Severity Selector */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">How urgent is this?</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Critical', 'High', 'Medium', 'Low'].map((sev) => (
                                        <button
                                            key={sev}
                                            onClick={() => setFormData({ ...formData, severity: sev })}
                                            className={clsx(
                                                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                                formData.severity === sev
                                                    ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                            )}
                                        >
                                            <SeverityBadge severity={sev} />
                                            <span className="text-sm text-slate-600 flex-1">
                                                {sev === 'Critical' ? 'Safety hazard / Work Stopped' :
                                                    sev === 'High' ? 'Significant Delay' :
                                                        sev === 'Medium' ? 'Minor Issue' : 'FYI / Documentation'}
                                            </span>
                                            {formData.severity === sev && <CheckCircle size={18} className="text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 md:absolute md:w-full">
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.description && photoFiles.length === 0 || submitting}
                                className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Issue'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS */}
                {currentStep === 4 && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Issue Reported!</h2>
                        <p className="text-slate-500 mb-8 max-w-xs">
                            Manager has been notified. We've assigned ticket <span className="font-mono font-bold text-slate-700">#{newIssueId || 'ISS-???'}</span>.
                        </p>

                        <div className="bg-slate-50 p-6 rounded-2xl w-full max-w-sm mb-8">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                                <span className="text-sm text-slate-500">Expected Response</span>
                                <span className="text-sm font-bold text-slate-800">~30 Mins</span>
                            </div>
                            <div className="text-left space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">What's Next?</p>
                                <div className="flex gap-3 text-sm text-slate-600">
                                    <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                                    <span>Stay on site if safe. Answer phone if manager calls.</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={onCancel} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl">
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
