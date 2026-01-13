import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin,
    Camera,
    Video,
    Mic,
    ClipboardList,
    Plus,
    X,
    CheckCircle2,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../../lib/firebase';
import { useGeolocation } from '../../../hooks/useGeolocation';

export default function SiteAuditFAB({ currentStep, data, updateData, showToast }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const { location, error: gpsError } = useGeolocation();

    // Auto collapse on scroll
    useEffect(() => {
        let timeout;
        const handleScroll = () => {
            setIsScrolling(true);
            setIsOpen(false);
            clearTimeout(timeout);
            timeout = setTimeout(() => setIsScrolling(false), 200);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Tool Handlers
    const handleGPS = async () => {
        if (location?.latitude) {
            updateData('site', {
                gpsCoordinates: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timestamp: new Date().toISOString()
                }
            });
            showToast(`Location Pinned: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`, 'success');
        } else if (gpsError) {
            showToast(`GPS Error: ${gpsError.message}`, 'error');
        } else {
            showToast('Waiting for GPS signal...', 'info');
        }
    };

    const handleCamera = () => {
        document.getElementById('fab-camera-input').click();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const user = auth.currentUser;
        if (!user) {
            if (showToast) showToast("Authentication required. Please sign in.", 'error');
            return;
        }

        setIsUploading(true);
        if (showToast) showToast("Uploading photo...", 'info');

        try {

            const auditId = data.id || 'temp_audit';
            // Path must match storage.rules
            const storageRef = ref(storage, `site_photos/audits/${auditId}/quick_photos/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {
                    console.error("FAB: Photo Upload Error:", error);
                    setIsUploading(false);
                    let errMsg = "Upload failed";
                    if (error.code === 'storage/unauthorized') {
                        errMsg = "Permission Denied. Role check failed.";
                    }
                    if (showToast) showToast(errMsg, 'error');
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        const currentPhotos = data.client?.photos || [];
                        updateData('client', { photos: [...currentPhotos, downloadURL] });
                        setIsUploading(false);
                        if (showToast) showToast("Photo added!", 'success');
                    });
                }
            );
        } catch (error) {
            console.error("FAB: Photo exception:", error);
            setIsUploading(false);
        } finally {
            e.target.value = null;
        }
    };

    const handleVideo = () => {
        document.getElementById('fab-video-input').click();
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const user = auth.currentUser;
        if (!user) {
            if (showToast) showToast("Authentication required.", 'error');
            return;
        }

        setIsUploading(true);
        if (showToast) showToast("Uploading Video...", 'info');

        try {

            const auditId = data.id || 'temp_audit';
            const storageRef = ref(storage, `site_photos/audits/${auditId}/quick_videos/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {
                    console.error("FAB: Video Upload Error:", error);
                    setIsUploading(false);
                    if (showToast) showToast("Video upload failed", 'error');
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        const currentVideos = data.site?.videos || [];
                        updateData('site', { videos: [...currentVideos, downloadURL] });
                        setIsUploading(false);
                        if (showToast) showToast("Video added!", 'success');
                    });
                }
            );
        } catch (error) {
            console.error("FAB: Video exception:", error);
            setIsUploading(false);
        } finally {
            e.target.value = null;
        }
    };

    const handleVoice = () => {
        document.getElementById('fab-voice-input').click();
    };

    const handleVoiceUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const user = auth.currentUser;
        if (!user) {
            if (showToast) showToast("Authentication required.", 'error');
            return;
        }

        setIsUploading(true);
        if (showToast) showToast("Uploading Voice Note...", 'info');

        try {

            const auditId = data.id || 'temp_audit';
            const storageRef = ref(storage, `site_photos/audits/${auditId}/quick_voice/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {
                    console.error("FAB: Voice Upload Error:", error);
                    setIsUploading(false);
                    if (showToast) showToast("Voice upload failed", 'error');
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        const currentVoice = data.site?.voiceNotes || [];
                        updateData('site', { voiceNotes: [...currentVoice, downloadURL] });
                        setIsUploading(false);
                        if (showToast) showToast("Voice Note added!", 'success');
                    });
                }
            );
        } catch (error) {
            console.error("FAB: Voice exception:", error);
            setIsUploading(false);
        } finally {
            e.target.value = null;
        }
    };

    const handleChecklist = () => {
        setShowNoteModal(true);
    };

    const handleSaveNote = () => {
        if (!currentNote.trim()) return;

        const note = {
            id: Date.now().toString(),
            text: currentNote,
            timestamp: new Date().toISOString()
        };

        const currentNotes = data.site?.notes || [];
        updateData('site', { notes: [...currentNotes, note] });

        showToast("Quick Note saved!", 'success');
        setCurrentNote('');
        setShowNoteModal(false);
    };

    const menuItems = [
        { icon: MapPin, label: 'GPS Mark', action: handleGPS, color: 'text-blue-500' },
        { icon: Camera, label: 'Photo', action: handleCamera, color: 'text-emerald-500' },
        { icon: Video, label: 'Video', action: handleVideo, color: 'text-purple-500' },
        { icon: Mic, label: 'Voice Note', action: handleVoice, color: 'text-amber-500' },
        { icon: ClipboardList, label: 'Quick Note', action: handleChecklist, color: 'text-slate-600' },
    ];

    return (
        <>
            {/* Quick Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800">Add Quick Note</h3>
                            <button onClick={() => setShowNoteModal(false)} className="p-1 rounded-full hover:bg-slate-100">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-blue-500 min-h-[120px]"
                            placeholder="Type observation here..."
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNoteModal(false)}
                                className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className="flex-1 py-3 bg-premium-blue-900 text-white font-bold rounded-xl shadow-lg hover:bg-premium-blue-800"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 touch-none">

                {/* Expanded Menu */}
                <div className={clsx(
                    "flex flex-col gap-3 transition-all duration-300 origin-bottom-right",
                    isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-10 pointer-events-none absolute bottom-0 right-0"
                )}>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                item.action();
                            }}
                            className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 pr-4 hover:bg-slate-50 transition-colors group"
                        >
                            <span className="text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-2 py-1 rounded-md shadow-sm absolute right-14 pointer-events-none">
                                {item.label}
                            </span>
                            <div className={clsx("p-2 rounded-full bg-slate-50", item.color)}>
                                <item.icon size={20} />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main FAB Trigger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={clsx(
                        "p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center relative",
                        isOpen ? "bg-slate-800 rotate-45" : "bg-premium-blue-800 hover:bg-premium-blue-900 hover:scale-110",
                        isScrolling && !isOpen && "opacity-50 hover:opacity-100"
                    )}
                >
                    {isUploading ? <Loader2 size={24} className="text-white animate-spin" /> : <Plus size={24} className="text-white" />}
                </button>

                {/* Hidden Inputs for Native Interactions */}
                <input
                    type="file"
                    id="fab-camera-input"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <input
                    type="file"
                    id="fab-video-input"
                    accept="video/*"
                    capture="camcorder"
                    className="hidden"
                    onChange={handleVideoUpload}
                />
                <input
                    type="file"
                    id="fab-voice-input"
                    accept="audio/*"
                    capture
                    className="hidden"
                    onChange={handleVoiceUpload}
                />
            </div>
        </>
    );
}
