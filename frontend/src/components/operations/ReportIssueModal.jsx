import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, AlertCircle, Building2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useProjects } from '../../contexts/ProjectsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useIssues } from '../../contexts/IssuesContext';

export default function ReportIssueModal({ isOpen, onClose, initialData = {} }) {
    const { addIssue } = useIssues();
    const { projects } = useProjects(); // Assuming this returns { projects: [...] }
    const { currentUser } = useAuth();

    // Form State
    const [title, setTitle] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [projectId, setProjectId] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Data Effect
    useEffect(() => {
        if (isOpen) {
            setTitle(initialData.title || '');
            setProjectId(initialData.projectId || '');
            setLocation(initialData.location || (initialData.projectName ? '' : ''));
            // If project is pre-selected, maybe location defaults to site address?
            // For now, let's just use what's passed or empty.
            if (initialData.projectId) {
                const proj = projects.find(p => p.id === initialData.projectId);
                if (proj) setLocation(proj.address || proj.location || '');
            }
        }
    }, [isOpen, initialData, projects]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter an issue title");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create Issue via Context
            const issueData = {
                title,
                severity,
                projectId,
                projectContext: projectId ? projects.find(p => p.id === projectId)?.name || 'Unknown Project' : 'General',
                location,
                description,
                reporter: {
                    name: currentUser?.displayName || currentUser?.email || 'Unknown User',
                    id: currentUser?.uid || 'anonymous',
                    email: currentUser?.email
                },
                photosCount: photos.length
            };

            // Dynamically import addIssue from helper if context is not available here? 
            // Actually, I should use useIssues hook if I can.
            // But this component is used inside IssuesDashboard which has Provider.
            // BUT it might be used elsewhere? 
            // It is only used in IssuesDashboard for now.
            // I will assume context usage is fine.
            // The file currently imports useProjects and useAuth. I need to add useIssues.

            // Wait, I need to add useIssues to imports first.
            // I will do that in the next tool call or I can do it now if I modify imports.
            // I'll stick to dynamic import of service for now to minimize changes? 
            // NO, the goal is to REMOVE service.
            // So I MUST use context.
            await addIssue(issueData);

            // 2. Create Timeline Event (if associated with a project)
            if (projectId) {
                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');

                await addDoc(collection(db, 'project_timeline'), {
                    projectId,
                    type: severity === 'Critical' ? 'error' : 'warning',
                    title: `Issue Reported: ${title}`,
                    description: `Severity: ${severity}. Reported by ${issueData.reporter.name}`,
                    author: issueData.reporter.name,
                    createdAt: serverTimestamp()
                });
            }

            onClose();
        } catch (error) {
            console.error("Failed to report issue:", error);
            // Toast handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    // Severity Options
    const SEVERITIES = [
        { label: 'Critical', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
        { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
        { label: 'Medium', color: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' },
        { label: 'Low', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Report Operational Issue
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Project Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Project / Site Context</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={projectId}
                                onChange={(e) => {
                                    setProjectId(e.target.value);
                                    // Auto-fill location if changed
                                    const proj = projects.find(p => p.id === e.target.value);
                                    if (proj) setLocation(proj.address || proj.location || '');
                                }}
                                disabled={!!initialData.projectId} // Lock if passed from project page
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <option value="">Select a project (Optional)...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Issue Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Issue Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Inverter Overheating"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:font-normal"
                        />
                    </div>

                    {/* Severity Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Severity Level</label>
                        <div className="grid grid-cols-4 gap-2">
                            {SEVERITIES.map((sev) => (
                                <button
                                    key={sev.label}
                                    type="button"
                                    onClick={() => setSeverity(sev.label)}
                                    className={clsx(
                                        "py-2 px-1 rounded-lg text-xs font-bold border transition-all",
                                        severity === sev.label
                                            ? `ring-2 ring-offset-1 ring-slate-900 ${sev.color}`
                                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    {sev.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Specific Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="e.g. Server Room or Battery Bank 2"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Describe the issue in detail..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Photo Upload Stub */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Photos</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer">
                            <Camera size={24} className="mb-2 opacity-50" />
                            <span className="text-xs font-medium">Click to upload photos</span>
                        </div>
                    </div>

                </form>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isSubmitting ? 'Reporting...' : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}
