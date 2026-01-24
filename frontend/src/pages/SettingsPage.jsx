import React, { useState } from 'react';
import { User, Bell, Lock, Shield, Eye, Smartphone, Save, Database, CheckCircle, AlertCircle, FileText, Building, Download, Zap } from 'lucide-react';
import clsx from 'clsx';
import { initializeRoles } from '../lib/systemInit';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import SystemAuditTrail from '../components/SystemAuditTrail';
import UserDetailModal from '../components/UserDetailModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { useCollection } from '../hooks/useFirestore';
import AutomationActivityLog from './AutomationActivityLog';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { hasRole, userProfile, simulateRole, isSimulated } = useAuth();
    const [businessProfile, setBusinessProfile] = useState({
        companyName: 'Primistine Electric Limited',
        phone: '',
        email: '',
        address: '',
        website: ''
    });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [isGeneratingLetterhead, setIsGeneratingLetterhead] = useState(false);
    const [initLoading, setInitLoading] = useState(false);

    // User Management State
    const [selectedUser, setSelectedUser] = useState(null); // For detail modal

    // Fetch business profile on mount (or when tab active)
    React.useEffect(() => {
        if (activeTab === 'business') {
            const fetchBusinessProfile = async () => {
                setLoadingProfile(true);
                try {
                    const docRef = doc(db, 'settings', 'business_profile');
                    const snapshot = await getDoc(docRef);
                    if (snapshot.exists()) {
                        setBusinessProfile(prev => ({ ...prev, ...snapshot.data() }));
                    }
                } catch (err) {
                    console.error("Failed to load business profile", err);
                } finally {
                    setLoadingProfile(false);
                }
            };
            fetchBusinessProfile();
        }
    }, [activeTab]);

    // Fetch Users (CRM-wide hooked fix)
    const { data: userList, loading: loadingUsers } = useCollection('users');
    const users = React.useMemo(() => userList || [], [userList]);

    const handleUserAction = async (action, user) => {
        if (action === 'toggle_status') {
            const newStatus = user.isActive === false ? true : false;
            const confirmMsg = newStatus
                ? `Reactivate user ${user.displayName}?`
                : `Deactivate user ${user.displayName}? They will no longer be able to login.`;

            if (!window.confirm(confirmMsg)) return;

            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    isActive: newStatus
                });
                toast.success(`User ${newStatus ? 'reactivated' : 'deactivated'}`);
                if (selectedUser?.uid === user.uid) {
                    setSelectedUser(prev => ({ ...prev, isActive: newStatus }));
                }
            } catch (error) {
                console.error("Failed to update user status", error);
                toast.error("Failed to update status");
            }
        }

        if (action === 'change_role') {
            const { newRole } = user;
            if (!window.confirm(`Are you sure you want to change ${user.displayName}'s role to ${newRole}?`)) return;

            try {
                // Fetch permissions for the new role
                const roleDoc = await getDoc(doc(db, 'roles', newRole));
                if (!roleDoc.exists()) {
                    toast.error("Role template not found. Please initialize roles in System Setup.");
                    return;
                }

                const { permissions } = roleDoc.data();

                await updateDoc(doc(db, 'users', user.uid), {
                    role: newRole,
                    permissions: permissions
                });

                toast.success(`User role updated to ${newRole}`);
                if (selectedUser?.uid === user.uid) {
                    setSelectedUser(prev => ({ ...prev, role: newRole, permissions: permissions }));
                }
            } catch (error) {
                console.error("Failed to update user role", error);
                toast.error("Failed to update role");
            }
        }
    };

    const formatLoginInfo = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM d, h:mm a');
        } catch (e) {
            return 'Unknown date';
        }
    };

    const handleInitializeRoles = async () => {
        if (!confirm("This will overwrite existing role templates. Continue?")) return;
        setInitLoading(true);
        try {
            await initializeRoles();
            toast.success("Roles initialized successfully");
        } catch (error) {
            console.error("Role initialization failed", error);
            toast.error("Failed to initialize roles");
        } finally {
            setInitLoading(false);
        }
    };

    const handleSaveBusinessProfile = async () => {
        const toastId = toast.loading("Saving business profile...");
        try {
            const docRef = doc(db, 'settings', 'business_profile');
            await setDoc(docRef, businessProfile, { merge: true });
            toast.success("Business profile updated", { id: toastId });
        } catch (error) {
            console.error("Failed to save profile", error);
            toast.error("Failed to save changes", { id: toastId });
        }
    };

    const handleDownloadBlankLetterhead = async () => {
        setIsGeneratingLetterhead(true);
        const toastId = toast.loading('Generating blank letterhead...');
        try {
            const element = document.getElementById('blank-letterhead-container');
            if (!element) throw new Error("Template not found");

            // Wait for image render (Critical fix)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
            pdf.save('Primistine_Letterhead_Blank.pdf');

            toast.success('Letterhead downloaded', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF', { id: toastId });
        } finally {
            setIsGeneratingLetterhead(false);
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
                    {hasRole(['super_admin', 'admin']) && (
                        <button onClick={() => setActiveTab('business')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'business' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                            <Building size={18} /> Business Profile
                        </button>
                    )}
                    <button onClick={() => setActiveTab('users')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'users' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                        <Shield size={18} /> User Management
                    </button>
                    {hasRole(['super_admin', 'admin']) && (
                        <>
                            <button onClick={() => setActiveTab('system')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'system' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                                <Database size={18} /> System Setup
                            </button>
                            <button onClick={() => setActiveTab('logs')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'logs' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                                <FileText size={18} /> Audit Logs
                            </button>
                            <button onClick={() => setActiveTab('automation')} className={clsx("w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all", activeTab === 'automation' ? "bg-white text-premium-blue-900 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50")}>
                                <Zap size={18} /> Automation & Events
                            </button>
                        </>
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
                    {/* Tab: Business Profile */}
                    {activeTab === 'business' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                            <h3 className="font-bold text-premium-blue-900 border-b border-slate-100 pb-4 flex justify-between items-center">
                                Business Information
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownloadBlankLetterhead}
                                        disabled={isGeneratingLetterhead}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingLetterhead ? 'Generating...' : <><Download size={16} /> Download Blank Letterhead</>}
                                    </button>
                                    <button
                                        onClick={handleSaveBusinessProfile}
                                        className="flex items-center gap-2 px-4 py-2 bg-premium-blue-900 text-white rounded-lg text-sm font-bold hover:bg-premium-blue-800 transition-colors"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </h3>

                            {loadingProfile ? (
                                <div className="p-8 text-center text-slate-400">Loading business settings...</div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                                            <input
                                                type="text"
                                                value={businessProfile.companyName}
                                                onChange={e => setBusinessProfile({ ...businessProfile, companyName: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-premium-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Phone</label>
                                            <input
                                                type="tel"
                                                value={businessProfile.phone}
                                                onChange={e => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                                                placeholder="+234..."
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-premium-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Email</label>
                                            <input
                                                type="email"
                                                value={businessProfile.email}
                                                onChange={e => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                                                placeholder="info@primistine.com"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-premium-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Office Address</label>
                                            <input
                                                type="text"
                                                value={businessProfile.address}
                                                onChange={e => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                                                placeholder="123 Street Name, City, State"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-premium-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
                                            <input
                                                type="text"
                                                value={businessProfile.website}
                                                onChange={e => setBusinessProfile({ ...businessProfile, website: e.target.value })}
                                                placeholder="www.primistine.com"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-premium-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                                        <p className="text-xs text-slate-500">
                                            <span className="font-bold text-slate-700">Note:</span> These details will appear on all generated PDF reports, quotes, and audit documents.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Hidden Letterhead Template for PDF Generation */}
                            <div id="blank-letterhead-container" className="fixed left-[-9999px] top-0 bg-white w-[210mm] min-h-[297mm]">
                                {/* Letterhead Header */}
                                <div className="relative w-full aspect-[4/1]">
                                    <img
                                        src="/letterhead.jpg"
                                        alt="Letterhead"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    {/* Overlay Content */}
                                    <div className="absolute top-[18%] right-[6%] text-right text-white z-10 font-serif font-bold text-lg tracking-wider drop-shadow-sm max-w-[250px]">
                                        {businessProfile?.phone}
                                    </div>
                                    <div className="absolute top-[46%] right-[6%] text-right text-white z-10 font-serif font-bold text-lg tracking-wider drop-shadow-sm max-w-[250px] break-words">
                                        {businessProfile?.email}
                                    </div>
                                    <div className="absolute top-[72%] right-[6%] text-right text-white z-10 font-serif font-bold text-lg tracking-wider leading-snug drop-shadow-sm max-w-[220px] ml-auto">
                                        {businessProfile?.address}
                                    </div>
                                </div>

                                {/* Empty Content Body */}
                                <div></div>
                            </div>
                        </div>
                    )}

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

                            {/* Diagnostics Hub Link */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <AlertCircle size={16} /> Diagnostics Hub
                                </h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    View system health, database latency, and live log stream.
                                </p>
                                <a
                                    href="/admin/diagnostics"
                                    className="px-4 py-2 bg-premium-blue-900 hover:bg-premium-blue-800 text-white rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2"
                                >
                                    Open Diagnostics
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Tab: System Logs */}
                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            <SystemAuditTrail />
                        </div>
                    )}

                    {/* Tab: Automation Logs */}
                    {activeTab === 'automation' && (
                        <div className="space-y-4">
                            <AutomationActivityLog />
                        </div>
                    )}

                    {/* Tab: User Management */}
                    {activeTab === 'users' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-premium-blue-900">User Registry</h3>
                                    <p className="text-sm text-slate-500">Manage access and monitor activity for all staff.</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                                        Total: {users.length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loadingUsers ? (
                                    <div className="text-center py-12 text-slate-400">Loading users...</div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">No users found in registry.</div>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user.uid}
                                            onClick={() => setSelectedUser(user)}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-premium-blue-300 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors",
                                                    user.role === 'super_admin' ? "bg-premium-gold-500" : "bg-premium-blue-900"
                                                )}>
                                                    {user.displayName?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                        {user.displayName || 'Unknown User'}
                                                        {user.role === 'super_admin' && <Shield size={12} className="text-premium-gold-500" />}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="block text-xs font-bold uppercase text-slate-600">{user.role}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {user.lastLogin ? formatLoginInfo(user.lastLogin) : 'Never logged in'}
                                                    </span>
                                                </div>
                                                <div className={clsx("w-2.5 h-2.5 rounded-full ring-2 ring-white",
                                                    user.isActive !== false ? "bg-green-500" : "bg-red-500"
                                                )} title={user.isActive !== false ? "Active" : "Deactivated"}></div>
                                                <button className="text-slate-300 group-hover:text-premium-blue-600 transition-colors">
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Deep Dive Modal */}
                            {selectedUser && (
                                <UserDetailModal
                                    user={selectedUser}
                                    onClose={() => setSelectedUser(null)}
                                    onAction={handleUserAction}
                                    currentUserProfile={userProfile}
                                />
                            )}
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
