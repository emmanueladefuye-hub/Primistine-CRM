import React from 'react';
import { X, Mail, Phone, MapPin, Award, Calendar, Briefcase, Star, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useDeployments } from '../contexts/DeploymentsContext';

const SKILLS_COLORS = {
    'Solar': 'bg-yellow-100 text-yellow-700',
    'Wiring': 'bg-blue-100 text-blue-700',
    'CCTV': 'bg-purple-100 text-purple-700',
    'Inverter': 'bg-green-100 text-green-700',
    'Battery': 'bg-orange-100 text-orange-700',
    'default': 'bg-slate-100 text-slate-600'
};

const AVAILABILITY_STYLES = {
    'Available': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'On Assignment': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'On Leave': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Off Duty': { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
};

export default function EngineerProfilePanel({ isOpen, onClose, engineer, onDeploy }) {
    const { getDeploymentsForEngineer } = useDeployments();

    // Get upcoming deployments for this engineer (must call hooks unconditionally)
    const upcomingDeployments = engineer
        ? (getDeploymentsForEngineer(engineer.id)
            ?.filter(d => d.status !== 'Cancelled' && d.status !== 'Completed')
            .slice(0, 5) || [])
        : [];

    if (!isOpen || !engineer) return null;

    const availability = engineer.availability || 'Available';
    const style = AVAILABILITY_STYLES[availability] || AVAILABILITY_STYLES['Available'];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-premium-blue-900 to-premium-blue-800 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                            {engineer.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{engineer.name}</h2>
                            <p className="text-premium-gold-300 font-medium">{engineer.role || 'Engineer'}</p>
                            <div className={clsx(
                                'inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-semibold',
                                style.bg, style.text
                            )}>
                                <span className={clsx('w-2 h-2 rounded-full', style.dot)} />
                                {availability}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Quick Actions */}
                    <div className="flex gap-3">
                        {engineer.email && (
                            <a
                                href={`mailto:${engineer.email}`}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                <Mail size={18} /> Email
                            </a>
                        )}
                        {engineer.phone && (
                            <a
                                href={`tel:${engineer.phone}`}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                <Phone size={18} /> Call
                            </a>
                        )}
                        {availability === 'Available' && onDeploy && (
                            <button
                                onClick={() => onDeploy(engineer)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-premium-blue-900 text-white rounded-xl hover:bg-premium-blue-800 transition-colors"
                            >
                                <Briefcase size={18} /> Deploy
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-premium-blue-900">
                                {engineer.completedDeployments || 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Completed</div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-premium-gold-600 flex items-center justify-center gap-1">
                                {engineer.rating || 0} <Star size={16} className="fill-current" />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Rating</div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-600">
                                {upcomingDeployments.length}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Scheduled</div>
                        </div>
                    </div>

                    {/* Skills */}
                    {engineer.skills?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Award size={16} /> Skills & Certifications
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {engineer.skills.map(skill => (
                                    <span
                                        key={skill}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-full text-xs font-semibold',
                                            SKILLS_COLORS[skill] || SKILLS_COLORS['default']
                                        )}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h3>
                        <div className="space-y-3">
                            {engineer.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{engineer.email}</span>
                                </div>
                            )}
                            {engineer.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{engineer.phone}</span>
                                </div>
                            )}
                            {engineer.address && (
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{engineer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Deployments */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Calendar size={16} /> Upcoming Schedule
                        </h3>
                        {upcomingDeployments.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-400">
                                <Clock size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No upcoming deployments</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingDeployments.map(deployment => {
                                    const date = deployment.scheduledDate?.toDate?.()
                                        ? deployment.scheduledDate.toDate()
                                        : new Date(deployment.scheduledDate);

                                    return (
                                        <div
                                            key={deployment.id}
                                            className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">
                                                        {deployment.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {deployment.clientInfo?.address || 'Location TBD'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-premium-blue-600">
                                                        {date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {deployment.scheduledTimeStart} - {deployment.scheduledTimeEnd}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
