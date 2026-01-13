import React, { useState } from 'react';
import { User, Bell, Lock, Shield, Eye, Smartphone, Save, Database, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { initializeRoles } from '../lib/systemInit';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { hasRole, userProfile, simulateRole, isSimulated } = useAuth();
    const [initLoading, setInitLoading] = useState(false);

    const handleInitializeRoles = async () => {
        if (!confirm("This will overwrite existing role templates. Continue?")) return;

        setInitLoading(true);
        try {
            await initializeRoles();
            toast.success("System roles initialized successfully");
        } catch (error) {
            console.error(error);
            toast.error(`Failed: ${error.message}`);
        } finally {
            setInitLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-premium-blue-900">System Settings</h1>
                <p className="text-slate-500">Manage your profile, preferences, and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Settings Navigation */}
                <div className="space-y-1">
                    <button onClick={() => setActiveTab('profile')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'profile' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                        <User size={18} /> Profile Information
                    </button>
                    <button onClick={() => setActiveTab('users')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'users' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                        <Shield size={18} /> User Management
                    </button>
                    {hasRole(['super_admin', 'admin']) && (
                        <button onClick={() => setActiveTab('system')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'system' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                            <Database size={18} /> System Setup
                        </button>
                    )}
                    <button className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all text-slate-600 hover:bg-white/50")}>
                        <Bell size={18} /> Notifications
                    </button>
                    <button className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all text-slate-600 hover:bg-white/50")}>
                        <Lock size={18} /> Security & Password
                    </button>
                </div>

                {/* Settings Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Tab: System Setup */}
                    {activeTab === 'system' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                            <h3 className="font-bold text-premium-blue-900 border-b border-slate-100 pb-4">System Initialization</h3>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Database size={16} /> Roles & Permissions
                                </h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    Initialize or reset the default role templates in the database.
                                    Required for new environments.
                                </p>
                                <button
                                    onClick={handleInitializeRoles}
                                    disabled={initLoading}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    {initLoading ? (
                                        <>Initializing...</>
                                    ) : (
                                        <>Initialize Roles</>
                                    )}
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Eye size={16} /> Role Simulator (Testing)
                                </h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    Temporarily switch your permissions to another role to test access controls.
                                    Refresh page to reset fully if needed.
                                </p>

                                {isSimulated ? (
                                    <div className="flex items-center gap-4 bg-amber-50 p-3 rounded border border-amber-200">
                                        <div className="text-sm text-amber-800 font-bold flex-1">
                                            Currently simulating: <span className="uppercase">{userProfile?.role}</span>
                                        </div>
                                        <button
                                            onClick={() => simulateRole(null)}
                                            className="px-3 py-1 bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-100 text-xs font-bold"
                                        >
                                            Exit Simulation
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                            onChange={(e) => {
                                                if (e.target.value) simulateRole(e.target.value);
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select Role to Simulate...</option>
                                            <option value="admin">Administrator (Level 4)</option>
                                            <option value="manager">Project Manager (Level 3)</option>
                                            <option value="finance">Finance Officer (Level 3)</option>
                                            <option value="inventory_manager">Inventory Manager (Level 3)</option>
                                            <option value="sales_rep">Sales Representative (Level 2)</option>
                                            <option value="engineer">Field Engineer (Level 2)</option>
                                            <option value="auditor">Site Auditor (Level 1)</option>
                                            <option value="viewer">Viewer (Level 0)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: User Management */}
                    {activeTab === 'users' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-premium-blue-900">Team Access & Roles</h3>
                                <button className="text-sm font-medium text-premium-blue-600 hover:underline">+ Invite User</button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'Demo User', email: 'admin@primistine.com', role: 'Super Admin', status: 'Active' },
                                    { name: 'Tobi Adebayo', email: 'tobi@primistine.com', role: 'Engineer', status: 'Active' },
                                    { name: 'Sarah Okon', email: 'sarah@primistine.com', role: 'Sales Manager', status: 'Active' },
                                    { name: 'Emmanuel Kalu', email: 'logistics@primistine.com', role: 'Viewer', status: 'Inactive' },
                                ].map((user, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">{user.role}</span>
                                            <div className={clsx("w-2 h-2 rounded-full", user.status === 'Active' ? "bg-green-500" : "bg-slate-300")}></div>
                                            <button className="text-slate-400 hover:text-slate-600"><Eye size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Profile (Default) */}
                    {activeTab === 'profile' && (
                        <>
                            {/* Profile Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-premium-blue-900 mb-6">Profile Details</h3>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-3xl">
                                        {/* <User size={32} /> */}
                                        {userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">
                                            Change Photo
                                        </button>
                                        <button className="text-sm font-medium text-red-500 hover:text-red-700">Remove</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            defaultValue={userProfile?.email}
                                            readOnly
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                                        <input
                                            type="text"
                                            defaultValue={userProfile?.role}
                                            readOnly
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 uppercase font-bold"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            Role can only be changed by another Super Admin or via System Setup.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
