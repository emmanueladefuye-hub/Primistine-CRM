import React, { useState } from 'react';
import { X, Building2, Calendar, Layout, User } from 'lucide-react';
import { createProject } from '../../services/firestore';
import toast from 'react-hot-toast';

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        clientEmail: '',
        address: '',
        dueDate: '',
        phase: 'Planning' // Default
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.clientName) {
            toast.error("Project Name and Client Name are required");
            return;
        }

        setIsSubmitting(true);
        try {
            // Construct payload matching our schema expectations
            const payload = {
                name: formData.name,
                client: formData.clientName, // Display string
                clientInfo: {
                    name: formData.clientName,
                    email: formData.clientEmail
                },
                location: formData.address,
                address: formData.address,
                status: 'In Progress',
                phase: formData.phase,
                phases: {
                    current: formData.phase,
                    history: [{ phase: formData.phase, date: new Date().toISOString() }]
                },
                progress: 0,
                health: 'healthy',
                timeline: {
                    startDate: new Date().toISOString(),
                    expectedCompletion: formData.dueDate
                },
                dueDate: formData.dueDate
            };

            await createProject(payload);
            toast.success("Project created successfully!");
            onSuccess?.(); // Optional callback to refresh parent or navigate
            onClose();
        } catch (error) {
            console.error("Failed to create project:", error);
            toast.error("Failed to create project.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Layout className="text-premium-blue-600" size={20} />
                        Create New Project
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Project Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Project Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Lekki Phase 1 Solar Install"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            autoFocus
                        />
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Client Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="e.g. Dr. Okafor"
                                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Client Email</label>
                            <input
                                type="email"
                                placeholder="client@example.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.clientEmail}
                                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Site Address</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="e.g. 15 Admiralty Way, Lekki"
                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Dates & Phase */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Target Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Starting Phase</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                                value={formData.phase}
                                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                            >
                                <option value="Planning">Planning</option>
                                <option value="Procurement">Procurement</option>
                                <option value="Installation">Installation</option>
                                <option value="Testing">Testing</option>
                                <option value="Handover">Handover</option>
                            </select>
                        </div>
                    </div>

                </form>

                {/* Footer */}
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
                        className="px-6 py-2.5 text-sm font-bold text-white bg-premium-blue-900 hover:bg-premium-blue-800 rounded-xl shadow-lg shadow-premium-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isSubmitting ? 'Creating Project...' : 'Create Project'}
                    </button>
                </div>

            </div>
        </div>
    );
}
