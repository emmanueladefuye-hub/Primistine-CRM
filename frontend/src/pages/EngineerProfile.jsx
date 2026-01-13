import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Star, Calendar, CheckCircle, Clock, Award, Briefcase } from 'lucide-react';
import clsx from 'clsx';

export default function EngineerProfile() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('tasks');

    // Mock Data
    const ENGINEER = {
        id: 1,
        name: 'Engr. Tobi Adebayo',
        role: 'Senior Engineer',
        dept: 'Engineering',
        email: 'tobi@primistine.com',
        phone: '08011223344',
        location: 'Lekki Branch',
        rating: 4.8,
        completedAudits: 24,
        activeTasks: 3,
        availability: 'Available'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/teams" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900">Engineer Profile</h1>
                    <p className="text-slate-500">Performance metrics and task assignment.</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                        <Mail size={16} /> Send Message
                    </button>
                    <button className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20">
                        Assign Task
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                    <div className="w-32 h-32 bg-premium-blue-100 text-premium-blue-700 rounded-full flex items-center justify-center text-4xl font-bold">
                        {ENGINEER.name.charAt(0)}
                    </div>
                    <div className="text-center">
                        <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {ENGINEER.availability}
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{ENGINEER.name}</h2>
                        <p className="text-slate-500 font-medium">{ENGINEER.role} • {ENGINEER.dept}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="p-2 bg-white rounded text-slate-500"><Mail size={18} /></div>
                            <div className="text-sm font-medium text-slate-700 truncate">{ENGINEER.email}</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="p-2 bg-white rounded text-slate-500"><Phone size={18} /></div>
                            <div className="text-sm font-medium text-slate-700">{ENGINEER.phone}</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="p-2 bg-white rounded text-slate-500"><MapPin size={18} /></div>
                            <div className="text-sm font-medium text-slate-700">{ENGINEER.location}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Performance Rating</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-premium-gold-600">{ENGINEER.rating}</span>
                                <div className="flex text-premium-gold-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 4 ? "currentColor" : "none"} />)}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Audits Completed</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-premium-blue-900">{ENGINEER.completedAudits}</span>
                                <Award size={20} className="text-premium-blue-200" />
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Active Tasks</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-700">{ENGINEER.activeTasks}</span>
                                <Briefcase size={20} className="text-slate-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle size={18} className="text-slate-400" /> Assigned Tasks
                </div>
                <div className="divide-y divide-slate-100">
                    {[1, 2, 3].map((task) => (
                        <div key={task} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <input type="checkbox" className="w-5 h-5 accent-premium-blue-900 rounded border-slate-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Complete Site Audit - Lekki Gardens</h4>
                                    <p className="text-sm text-slate-500 mt-1">Verify inverter load and check battery health.</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">High Priority</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Due Today, 4:00 PM</span>
                                    </div>
                                </div>
                            </div>
                            <button className="text-sm font-medium text-premium-blue-600 hover:text-premium-blue-800">
                                Details
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
