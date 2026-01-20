import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, User, ChevronRight, Loader2 } from 'lucide-react';
import { useTeams } from '../../contexts/TeamsContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function ScheduleVisitModal({ isOpen, onClose, project }) {
    const { teamMembers, loading: teamsLoading } = useTeams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: `Site Visit: ${project?.name || 'New Project'}`,
        engineerId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: '2h',
        type: 'Site Survey',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.engineerId) {
            toast.error("Please select an engineer");
            return;
        }

        setLoading(true);
        try {
            const selectedEngineer = teamMembers.find(m => m.id === formData.engineerId);

            await addDoc(collection(db, 'visits'), {
                ...formData,
                projectId: project.id,
                projectName: project.name,
                clientName: project.clientName || project.clientInfo?.name,
                location: project.location || project.address,
                engineerName: selectedEngineer.name,
                status: 'Scheduled',
                createdAt: serverTimestamp()
            });

            // Also add a project log
            await addDoc(collection(db, 'project_logs'), {
                projectId: project.id,
                type: 'System',
                message: `Visit scheduled: ${formData.title} for ${selectedEngineer.name} on ${formData.date}`,
                user: 'System',
                timestamp: serverTimestamp()
            });

            toast.success("Visit scheduled successfully");
            onClose();
        } catch (err) {
            console.error("Failed to schedule visit:", err);
            toast.error("Error scheduling visit");
        } finally {
            setLoading(false);
        }
    };

    const activeEngineers = teamMembers?.filter(m => m.status === 'Active') || [];

    return (
        <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Schedule Visit</h2>
                        <p className="text-sm font-medium text-slate-400 mt-1">Book a field engineer for {project?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 no-scrollbar">
                    {/* Activity Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Activity Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            placeholder="e.g. Site Survey / Installation Setup"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Assignee Selection */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Assign Engineer</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.engineerId}
                                    onChange={e => setFormData({ ...formData, engineerId: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">Select Engineer...</option>
                                    {activeEngineers.map(eng => (
                                        <option key={eng.id} value={eng.id}>{eng.name} ({eng.role})</option>
                                    ))}
                                </select>
                                <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Target Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start Time</label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="time"
                                    required
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visit Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Visit Type</label>
                        <div className="flex gap-2">
                            {['Site Survey', 'Procurement', 'Installation', 'Testing', 'Handover'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={clsx(
                                        "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                        formData.type === type
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Specific Instructions</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none"
                            placeholder="Add access instructions or specific tools needed..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || teamsLoading}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-colors shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                "Confirm Booking"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
