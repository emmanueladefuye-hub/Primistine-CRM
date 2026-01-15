import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, AlertCircle, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useDeployments } from '../contexts/DeploymentsContext';
import { useTeams } from '../contexts/TeamsContext';
import { useProjects } from '../contexts/ProjectsContext';
import { useAudits } from '../contexts/AuditsContext';
import { toast } from 'react-hot-toast';

const DEPLOYMENT_TYPES = [
    { id: 'Audit', label: 'Site Audit', color: 'bg-purple-100 text-purple-700' },
    { id: 'Installation', label: 'Installation', color: 'bg-blue-100 text-blue-700' },
    { id: 'Maintenance', label: 'Maintenance', color: 'bg-green-100 text-green-700' },
    { id: 'Inspection', label: 'Inspection', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'Follow-up', label: 'Follow-up', color: 'bg-slate-100 text-slate-700' }
];

const PRIORITY_OPTIONS = [
    { id: 'Low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
    { id: 'Normal', label: 'Normal', color: 'bg-blue-100 text-blue-600' },
    { id: 'High', label: 'High', color: 'bg-orange-100 text-orange-600' },
    { id: 'Urgent', label: 'Urgent', color: 'bg-red-100 text-red-600' }
];

export default function DeploymentModal({ isOpen, onClose, initialDate = null, editingDeployment = null, initialLeadId = null }) {
    const { createDeployment, updateDeployment, checkConflicts, canWrite } = useDeployments();
    const { engineers, getAvailableEngineers } = useTeams();
    const { projects } = useProjects();
    const { audits } = useAudits();

    const isEditing = !!editingDeployment;

    const [formData, setFormData] = useState({
        title: editingDeployment?.title || '',
        type: editingDeployment?.type || 'Installation',
        projectId: editingDeployment?.projectId || '',
        auditId: editingDeployment?.auditId || '',
        clientName: editingDeployment?.clientInfo?.name || '',
        clientAddress: editingDeployment?.clientInfo?.address || '',
        clientPhone: editingDeployment?.clientInfo?.phone || '',
        leadEngineerId: editingDeployment?.leadEngineerId || initialLeadId || '',
        assignedEngineers: editingDeployment?.assignedEngineers?.map(e => e.id) || [],
        scheduledDate: editingDeployment?.scheduledDate
            ? new Date(editingDeployment.scheduledDate.toDate?.() || editingDeployment.scheduledDate).toISOString().split('T')[0]
            : initialDate || new Date().toISOString().split('T')[0],
        scheduledTimeStart: editingDeployment?.scheduledTimeStart || '09:00',
        scheduledTimeEnd: editingDeployment?.scheduledTimeEnd || '17:00',
        priority: editingDeployment?.priority || 'Normal',
        notes: editingDeployment?.notes || ''
    });

    // Auto-fill client info when project or audit changes
    useEffect(() => {
        if (formData.projectId) {
            const project = projects?.find(p => p.id === formData.projectId);
            if (project) {
                setFormData(prev => ({
                    ...prev,
                    clientName: project.customerName || project.clientName || prev.clientName,
                    clientAddress: project.location || project.siteAddress || prev.clientAddress,
                    clientPhone: project.customerPhone || prev.clientPhone,
                    title: prev.title || `${project.title || 'Project'} - Deployment`
                }));
            }
        }
    }, [formData.projectId, projects]);

    useEffect(() => {
        if (formData.auditId) {
            const audit = audits?.find(a => a.id === formData.auditId);
            if (audit) {
                setFormData(prev => ({
                    ...prev,
                    clientName: audit.clientName || prev.clientName,
                    clientAddress: audit.siteAddress || prev.clientAddress,
                    clientPhone: audit.clientPhone || prev.clientPhone,
                    title: prev.title || `Site Audit - ${audit.clientName}`
                }));
            }
        }
    }, [formData.auditId, audits]);

    const [conflicts, setConflicts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get available engineers for the selected date
    const availableEngineers = useMemo(() => {
        return getAvailableEngineers(formData.scheduledDate);
    }, [formData.scheduledDate, getAvailableEngineers]);

    // Check for conflicts when engineers or date changes
    const handleEngineerToggle = (engineerId) => {
        let newAssigned;
        if (formData.assignedEngineers.includes(engineerId)) {
            newAssigned = formData.assignedEngineers.filter(id => id !== engineerId);
        } else {
            newAssigned = [...formData.assignedEngineers, engineerId];
        }
        setFormData({ ...formData, assignedEngineers: newAssigned });

        // Check conflicts
        const allEngineers = formData.leadEngineerId
            ? [...newAssigned, formData.leadEngineerId]
            : newAssigned;
        const foundConflicts = checkConflicts(
            allEngineers,
            formData.scheduledDate,
            editingDeployment?.id
        );
        setConflicts(foundConflicts);
    };

    const handleLeadEngineerChange = (engineerId) => {
        setFormData({ ...formData, leadEngineerId: engineerId });

        // Check conflicts
        const allEngineers = [engineerId, ...formData.assignedEngineers];
        const foundConflicts = checkConflicts(
            allEngineers,
            formData.scheduledDate,
            editingDeployment?.id
        );
        setConflicts(foundConflicts);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canWrite) return;

        setIsSubmitting(true);
        try {
            const deploymentData = {
                title: formData.title,
                type: formData.type,
                projectId: formData.projectId || null,
                auditId: formData.auditId || null,
                clientInfo: {
                    name: formData.clientName,
                    address: formData.clientAddress,
                    phone: formData.clientPhone
                },
                leadEngineerId: formData.leadEngineerId,
                assignedEngineers: formData.assignedEngineers.map(id => {
                    const eng = engineers?.find(e => e.id === id);
                    return { id, name: eng?.name || 'Unknown', role: eng?.role || 'Engineer' };
                }),
                scheduledDate: new Date(formData.scheduledDate),
                scheduledTimeStart: formData.scheduledTimeStart,
                scheduledTimeEnd: formData.scheduledTimeEnd,
                priority: formData.priority,
                notes: formData.notes
            };

            if (isEditing) {
                await updateDeployment(editingDeployment.id, deploymentData);
            } else {
                await createDeployment(deploymentData);
            }

            onClose();
        } catch (err) {
            console.error('Failed to save deployment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-premium-blue-900">
                            {isEditing ? 'Edit Deployment' : 'Schedule Deployment'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Assign engineers to on-site work
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Conflict Warning */}
                {conflicts.length > 0 && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-medium text-red-700">Scheduling Conflict Detected</p>
                            <p className="text-sm text-red-600 mt-1">
                                {conflicts.map(c => {
                                    const eng = engineers?.find(e => e.id === c.engineerId);
                                    return eng?.name || 'Engineer';
                                }).join(', ')} already scheduled for this date.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Project/Audit Selection */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Link to Project
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, auditId: '' })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-premium-gold-400"
                            >
                                <option value="">No Project Linked</option>
                                {projects?.map(p => (
                                    <option key={p.id} value={p.id}>{p.title || p.name || p.customerName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Link to Site Audit
                            </label>
                            <select
                                value={formData.auditId}
                                onChange={(e) => setFormData({ ...formData, auditId: e.target.value, projectId: '' })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-premium-gold-400"
                            >
                                <option value="">No Audit Linked</option>
                                {audits?.map(a => (
                                    <option key={a.id} value={a.id}>{a.clientName || a.id}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Solar Installation - Lekki"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                            >
                                {DEPLOYMENT_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Calendar size={14} className="inline mr-1" /> Date
                            </label>
                            <input
                                type="date"
                                value={formData.scheduledDate}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Clock size={14} className="inline mr-1" /> Start Time
                            </label>
                            <input
                                type="time"
                                value={formData.scheduledTimeStart}
                                onChange={(e) => setFormData({ ...formData, scheduledTimeStart: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Clock size={14} className="inline mr-1" /> End Time
                            </label>
                            <input
                                type="time"
                                value={formData.scheduledTimeEnd}
                                onChange={(e) => setFormData({ ...formData, scheduledTimeEnd: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                            />
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <MapPin size={16} /> Client & Location
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                placeholder="Client Name"
                                className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                            />
                            <input
                                type="tel"
                                value={formData.clientPhone}
                                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                                placeholder="Phone Number"
                                className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                            />
                        </div>
                        <input
                            type="text"
                            value={formData.clientAddress}
                            onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                            placeholder="Site Address"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                        />
                    </div>

                    {/* Lead Engineer */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <Users size={16} /> Lead Engineer
                        </label>
                        <select
                            value={formData.leadEngineerId}
                            onChange={(e) => handleLeadEngineerChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400"
                            required
                        >
                            <option value="">Select Lead Engineer</option>
                            {engineers?.map(eng => (
                                <option key={eng.id} value={eng.id}>
                                    {eng.name} {eng.availability === 'On Assignment' ? '(Busy)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Support Engineers */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Support Team (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {engineers?.filter(e => e.id !== formData.leadEngineerId).map(eng => (
                                <button
                                    key={eng.id}
                                    type="button"
                                    onClick={() => handleEngineerToggle(eng.id)}
                                    className={clsx(
                                        'px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                                        formData.assignedEngineers.includes(eng.id)
                                            ? 'bg-premium-blue-900 text-white border-premium-blue-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-premium-blue-300'
                                    )}
                                >
                                    {eng.name}
                                    {eng.availability === 'On Assignment' && (
                                        <span className="ml-1 text-xs opacity-75">(Busy)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Priority</label>
                        <div className="flex gap-2">
                            {PRIORITY_OPTIONS.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p.id })}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                        formData.priority === p.id
                                            ? p.color + ' ring-2 ring-offset-2 ring-current'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any special instructions or requirements..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-premium-gold-400 resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canWrite}
                        className={clsx(
                            'px-6 py-3 rounded-xl font-medium transition-all',
                            canWrite
                                ? 'bg-premium-blue-900 text-white hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Deployment' : 'Schedule Deployment')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
