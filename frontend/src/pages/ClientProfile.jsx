import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, Phone, Mail, Edit, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

export default function ClientProfile() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');

    // Mock Client Data
    const CLIENT = {
        id: 1,
        name: 'Lekki Gardens Estate',
        type: 'Corporate',
        address: 'Block 4, Plot 2, Lekki Phase 1, Lagos',
        contact: { name: 'Mr. Tunde', role: 'Facility Manager', phone: '08012345678', email: 'facility@lekkigardens.com' },
        stats: { totalProjects: 3, activeProjects: 1, totalSpent: '₦45.2M', lastContact: '2 days ago' }
    };

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'projects', label: 'Projects' },
        { id: 'billing', label: 'Billing & Invoices' },
        { id: 'documents', label: 'Documents' },
    ];

    return (
        <div className="space-y-6">
            {/* Context Header */}
            <div className="flex items-center gap-4">
                <Link to="/clients" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase tracking-wide">Corporate</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold uppercase tracking-wide">Active</span>
                    </div>
                    <h1 className="text-2xl font-bold text-premium-blue-900 mt-1">{CLIENT.name}</h1>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                        <Edit size={16} /> Edit Profile
                    </button>
                    <button className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20">
                        + New Project
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-premium-blue-50 text-premium-blue-700 rounded-xl flex items-center justify-center">
                            <Building size={32} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Primary Contact</label>
                            <div className="font-bold text-slate-800">{CLIENT.contact.name}</div>
                            <div className="text-sm text-slate-500">{CLIENT.contact.role}</div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-slate-400 mt-1" />
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                                <div className="text-sm font-medium text-slate-700">{CLIENT.address}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone size={18} className="text-slate-400 mt-1" />
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                                <div className="text-sm font-medium text-slate-700">{CLIENT.contact.phone}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail size={18} className="text-slate-400 mt-1" />
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                                <div className="text-sm font-medium text-slate-700">{CLIENT.contact.email}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 lg:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Key Statistics</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-2xl font-bold text-premium-blue-900">{CLIENT.stats.totalProjects}</div>
                                <div className="text-xs text-slate-500">Total Projects</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-2xl font-bold text-premium-gold-600">{CLIENT.stats.totalSpent}</div>
                                <div className="text-xs text-slate-500">Lifetime Value</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-sm font-bold text-slate-700">{CLIENT.stats.lastContact}</div>
                                <div className="text-xs text-slate-500">Last Activity</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="border-b border-slate-200">
                    <div className="flex gap-8">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "pb-4 text-sm font-bold transition-all relative",
                                    activeTab === tab.id ? "text-premium-blue-900" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-premium-blue-900 rounded-t-full"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab: Projects */}
                {activeTab === 'projects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mock Project 1 */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800">50kW Hybrid System - Phase 2</h3>
                                    <p className="text-xs text-slate-500">Main Facility Building</p>
                                </div>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full mb-4">
                                <div className="h-full bg-green-500 rounded-full w-[65%]"></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Started: Feb 2026</span>
                                <span>65% Complete</span>
                            </div>
                        </div>
                        {/* Mock Project 2 */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow opacity-75">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800">Security Post Solar</h3>
                                    <p className="text-xs text-slate-500">Gatehouse A & B</p>
                                </div>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">Completed</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full mb-4">
                                <div className="h-full bg-slate-400 rounded-full w-full"></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Completed: Dec 2025</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Billing */}
                {activeTab === 'billing' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                                <tr>
                                    <th className="p-4">Invoice ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-4 font-mono text-slate-600">INV-2026-045</td>
                                    <td className="p-4 text-slate-600">Feb 15, 2026</td>
                                    <td className="p-4 font-bold text-slate-800">₦2,450,000</td>
                                    <td className="p-4"><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">Unpaid</span></td>
                                    <td className="p-4 text-right"><button className="text-premium-blue-600 hover:underline">View PDF</button></td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-mono text-slate-600">INV-2026-012</td>
                                    <td className="p-4 text-slate-600">Jan 10, 2026</td>
                                    <td className="p-4 font-bold text-slate-800">₦4,100,000</td>
                                    <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Paid</span></td>
                                    <td className="p-4 text-right"><button className="text-premium-blue-600 hover:underline">View PDF</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: Overview (Default) */}
                {activeTab === 'overview' && (
                    <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Detailed notes, activity logs, and system diagrams would appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
