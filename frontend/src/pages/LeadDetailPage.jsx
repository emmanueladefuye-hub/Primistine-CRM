import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Building, Calendar, FileText, MessageSquare, Clock, Plus, Tag, Paperclip, MoreHorizontal, CheckCircle2, X, Edit3, ArrowRight, Rocket, Users, DollarSign } from 'lucide-react';
import clsx from 'clsx';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useLeads } from '../contexts/LeadsContext';
import { PIPELINE_STAGES } from '../lib/constants';

// Helper to map display service to internal key
const mapServiceInterestToKey = (interest) => {
    if (!interest) return null;
    const map = {
        'Solar & Inverter': 'solar',
        'CCTV & Security': 'cctv',
        'Electrical Wiring': 'wiring',
        'Generator / ATS': 'generator',
        'Earthing & Surge': 'earthing',
        'Industrial Safety': 'industrial'
    };
    return map[interest] || null;
};

// Edit Lead Modal Component
function EditLeadModal({ isOpen, onClose, lead, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        value: '',
        stage: '',
        source: '',
        notes: '',
        serviceInterest: []
    });
    const [showWonPrompt, setShowWonPrompt] = useState(false);
    const navigate = useNavigate();

    const SERVICE_INTERESTS = ['Solar & Inverter', 'CCTV & Security', 'Electrical Wiring', 'Generator / ATS', 'Earthing & Surge', 'Industrial Safety'];

    useEffect(() => {
        if (lead) {
            setFormData({
                name: lead.name || '',
                company: lead.company || '',
                email: lead.email || '',
                phone: lead.phone || '',
                address: lead.address || '',
                value: lead.value || '',
                stage: lead.stage || 'new',
                source: lead.source || '',
                notes: lead.notes || '',
                serviceInterest: lead.serviceInterest || []
            });
            setShowWonPrompt(false);
        }
    }, [lead, isOpen]);

    if (!isOpen || !lead) return null;

    const parseCurrencyString = (str) => {
        if (!str) return 0;
        const cleanStr = str.toString().toLowerCase().replace(/[^0-9.kmb]/g, '');
        let multiplier = 1;
        if (cleanStr.includes('k')) multiplier = 1000;
        if (cleanStr.includes('m')) multiplier = 1000000;
        if (cleanStr.includes('b')) multiplier = 1000000000;
        const num = parseFloat(cleanStr.replace(/[kmb]/g, ''));
        return isNaN(num) ? 0 : num * multiplier;
    };

    const handleServiceSelect = (interest) => {
        setFormData(prev => ({ ...prev, serviceInterest: [interest] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.serviceInterest.length === 0) {
            toast.error("Please select a service interest");
            return;
        }

        // Intercept "Closed Won" if it wasn't won before
        if (formData.stage === 'won' && lead.stage !== 'won') {
            setShowWonPrompt(true);
            return;
        }

        saveLead();
    };

    const saveLead = (extraFields = {}) => {
        const rawValue = parseCurrencyString(formData.value);

        onSave({
            ...formData,
            ...extraFields,
            value: rawValue, // Store as number
            lastContact: 'Just now'
        });
        onClose();
    };

    const handleScheduleAudit = () => {
        // Save as won first, then navigate
        const interest = formData.serviceInterest?.[0];
        const serviceKey = mapServiceInterestToKey(interest); // Use module-scope helper

        saveLead({ auditPending: true });

        navigate('/audits/new', {
            state: {
                leadData: { ...lead, ...formData },
                preSelectedService: serviceKey
            }
        });
    };

    const handleLater = () => {
        saveLead({ auditPending: true });
    };



    if (showWonPrompt) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-premium-blue-900">Lead Won! 🚀</h2>
                        <p className="text-slate-600">
                            Congratulations! Standard procedure requires a <span className="font-bold text-premium-blue-900">Site Audit</span> before a project can be created.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 border border-slate-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Client</span>
                                <span className="font-bold text-slate-700">{formData.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Deal Value</span>
                                <span className="font-bold text-green-600">{formData.value}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <button
                                onClick={handleScheduleAudit}
                                className="w-full py-3 bg-premium-blue-900 text-white rounded-xl font-bold hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 flex items-center justify-center gap-2"
                            >
                                <FileText size={18} /> Schedule Site Audit Now
                            </button>
                            <button
                                onClick={handleLater}
                                className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                            >
                                Do it Later (Mark as Audit Pending)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-premium-blue-900">Edit Lead</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Lead Name</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Company</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                            <input required type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
                            <input required type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            placeholder="Full address (Street, City, State)"
                            value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Value</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Stage</label>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })}>
                                {PIPELINE_STAGES.map((stage, idx) => {
                                    const currentIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
                                    // Disable if it's not the current stage, the next stage, or previous stages
                                    // User said "strictly from... and so on", so we disable forward skips.
                                    const isDisabled = idx > currentIdx + 1;

                                    return (
                                        <option key={stage.id} value={stage.id} disabled={isDisabled}>
                                            {stage.name} {isDisabled ? '(Skip Restricted)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                            Interested Service <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_INTERESTS.map(service => (
                                <button
                                    key={service}
                                    type="button"
                                    onClick={() => handleServiceSelect(service)}
                                    className={clsx("px-2 py-1 rounded-full text-xs font-medium border transition-all",
                                        (formData.serviceInterest || []).includes(service)
                                            ? "bg-premium-blue-50 border-premium-blue-200 text-premium-blue-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                    )}
                                >
                                    {service}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Source</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Notes</label>
                        <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </form>

                <div className="border-t border-slate-100 p-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-5 py-2.5 bg-premium-blue-900 text-white rounded-lg font-bold hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 transition-all">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper to get stage display info
const getStageInfo = (stageId) => {
    const stage = PIPELINE_STAGES.find(s => s.id === stageId);
    const colors = {
        'new': 'bg-blue-100 text-blue-700',
        'contacted': 'bg-yellow-100 text-yellow-700',
        'audit': 'bg-purple-100 text-purple-700',
        'proposal': 'bg-orange-100 text-orange-700',
        'won': 'bg-green-100 text-green-700'
    };
    return {
        name: stage?.name || 'Unknown',
        color: colors[stageId] || 'bg-slate-100 text-slate-700'
    };
};

// ... EditLeadModal ...

export default function LeadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { moveLeadStage, addNote } = useLeads();
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for new note
    const [noteText, setNoteText] = useState('');
    const [showStagePrompt, setShowStagePrompt] = useState(false);
    const [existingAudit, setExistingAudit] = useState(null);

    // Fetch Lead from Firestore
    useEffect(() => {
        const fetchLead = async () => {
            try {
                const docRef = doc(db, 'leads', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setLead({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('Lead not found');
                }
            } catch (err) {
                console.error("Error fetching lead:", err);
                setError('Failed to load lead details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchLead();
            // Also check for existing audit
            import('../lib/services/auditService').then(({ auditService }) => {
                auditService.getAuditByLeadId(id).then(audit => {
                    setExistingAudit(audit);
                });
            });
        }
    }, [id]);

    const handleSaveLead = async (updates) => {
        try {
            const docRef = doc(db, 'leads', lead.id);

            let finalUpdates = {
                ...updates,
                updatedAt: serverTimestamp()
            };

            // If stage is changing, use moveLeadStage for centralized logic
            if (updates.stage && updates.stage !== lead.stage) {
                await moveLeadStage(lead.id, updates.stage);
                // We still want to update other fields if any, but stage is handled
                const { stage, ...otherUpdates } = updates;
                if (Object.keys(otherUpdates).length > 0) {
                    await updateDoc(docRef, { ...otherUpdates, updatedAt: serverTimestamp() });
                }
            } else {
                await updateDoc(docRef, finalUpdates);
            }

            // Determine if stage changed for better notification
            if (updates.stage && updates.stage !== lead.stage) {
                const nextStage = PIPELINE_STAGES.find(s => s.id === updates.stage);
                toast.success(`Pipeline Updated: Moved to ${nextStage?.name || updates.stage}`, {
                    icon: '🚀',
                    style: {
                        borderRadius: '10px',
                        background: '#1e1b4b',
                        color: '#fff',
                    },
                });
            } else {
                toast.success('Lead updated successfully');
            }

            setLead(prev => {
                const newState = { ...prev, ...updates };
                if (finalUpdates.nextAction === null) newState.nextAction = null;
                return newState;
            });
        } catch (err) {
            console.error("Update failed", err);
            toast.error("Failed to update lead");
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;

        try {
            const newActivity = {
                id: Date.now(),
                type: 'note',
                text: noteText,
                date: new Date().toLocaleString(),
                user: 'Admin' // Should be currentUser.displayName in real app
            };

            const docRef = doc(db, 'leads', lead.id);
            await updateDoc(docRef, {
                activities: arrayUnion(newActivity)
            });

            setLead(prev => ({
                ...prev,
                activities: [newActivity, ...(prev.activities || [])]
            }));

            setNoteText('');
            toast.success('Note added');
        } catch (err) {
            console.error("Failed to add note", err);
            toast.error("Failed to save note");
        }
    };

    const handleMarkComplete = async () => {
        if (!lead) return;

        const actionText = lead.nextAction || `Follow up with ${lead.name}`;

        try {
            const docRef = doc(db, 'leads', lead.id);
            const newActivity = {
                id: Date.now(),
                type: 'status',
                text: `Completed action: ${actionText}`,
                date: new Date().toLocaleString(),
                user: 'Admin'
            };

            await updateDoc(docRef, {
                nextAction: null, // Clear the action
                lastContact: new Date().toLocaleString(), // Update last contact
                activities: arrayUnion(newActivity)
            });

            setLead(prev => ({
                ...prev,
                nextAction: null,
                lastContact: 'Just now',
                activities: [newActivity, ...(prev.activities || [])]
            }));

            toast.success("Action marked as complete");

            // Prompt to move to next stage if applicable
            const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
            if (currentIndex !== -1 && currentIndex < PIPELINE_STAGES.length - 1) {
                setShowStagePrompt(true);
            }
        } catch (err) {
            console.error("Failed to complete action", err);
            toast.error("Failed to update lead");
        }
    };

    const handlePromoteStage = async () => {
        const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
        if (currentIndex !== -1 && currentIndex < PIPELINE_STAGES.length - 1) {
            const nextStage = PIPELINE_STAGES[currentIndex + 1];
            await handleSaveLead({ stage: nextStage.id });
            setShowStagePrompt(false);
        }
    };

    const handleLaunchProject = async () => {
        const toastId = toast.loading('Launching project...');
        try {
            await createProjectFromLead(lead);
            toast.success('Project Launched Successfully! 🚀', { id: toastId });
            navigate('/projects');
        } catch (err) {
            console.error("Failed to launch project", err);
            toast.error("Failed to launch project", { id: toastId });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading lead details...</div>;

    // If lead not found, show error
    if (error || !lead) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/sales" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-premium-blue-900">Lead Not Found</h1>
                        <p className="text-slate-500">The lead you're looking for doesn't exist or has been deleted.</p>
                    </div>
                </div>
            </div>
        );
    }

    const stageInfo = getStageInfo(lead.stage);

    // Use activities from lead or default if empty
    const activities = lead.activities || [
        { id: 'init', type: 'status', text: `Lead created`, date: lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'Just now', user: 'System' }
    ];

    // Generate default documents placeholder
    const documents = lead.documents || [];

    // Determine if we should show a next action
    // If nextAction is explicitly null, don't show. If undefined, show default.
    const showNextAction = lead.nextAction !== null;
    const nextActionText = lead.nextAction || `Follow up with ${lead.name} regarding their inquiry.`;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <EditLeadModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                lead={lead}
                onSave={handleSaveLead}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex items-start gap-4 w-full">
                    <Link to="/sales" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all hover:bg-slate-50 shrink-0">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-black text-premium-blue-900 truncate tracking-tight">{lead.name}</h1>
                            <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", stageInfo.color)}>{stageInfo.name}</span>
                            {lead.auditPending && (
                                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <Clock size={12} /> Audit Pending
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 flex items-center gap-2 mt-1.5 text-sm font-medium">
                            <Building size={14} className="text-slate-400" /> <span className="truncate">{lead.company}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto items-center justify-start md:justify-end">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Edit3 size={16} /> <span className="sm:inline">Edit</span>
                    </button>

                    {/* Sequential Buttons */}
                    {lead.stage === 'new' && (
                        <button
                            disabled={!lead.serviceInterest?.[0]}
                            onClick={() => moveLeadStage(lead.id, 'contacted')}
                            className={clsx(
                                "flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-sm",
                                !lead.serviceInterest?.[0]
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                    : "bg-premium-gold-500 text-white hover:bg-premium-gold-600 shadow-lg shadow-premium-gold-500/20"
                            )}
                        >
                            <CheckCircle2 size={18} /> Mark Contacted
                        </button>
                    )}

                    {lead.stage === 'contacted' && (
                        <button
                            disabled={!lead.serviceInterest?.[0]}
                            onClick={async () => {
                                const interest = lead.serviceInterest?.[0];
                                const serviceKey = mapServiceInterestToKey(interest);
                                await moveLeadStage(lead.id, 'audit');
                                navigate('/audits/new', { state: { leadData: lead, preSelectedService: serviceKey } });
                            }}
                            className={clsx(
                                "flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-sm border-2",
                                !lead.serviceInterest?.[0]
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                    : "bg-premium-gold-500 text-white hover:bg-premium-gold-600 shadow-xl shadow-premium-gold-500/30 border-premium-gold-400"
                            )}
                        >
                            <Plus size={18} strokeWidth={3} /> Start Site Audit
                        </button>
                    )}

                    {lead.stage === 'audit' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                disabled={!lead.serviceInterest?.[0]}
                                onClick={() => moveLeadStage(lead.id, 'proposal')}
                                className={clsx(
                                    "flex-1 px-5 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-sm",
                                    !lead.serviceInterest?.[0]
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                        : "bg-premium-gold-500 text-white hover:bg-premium-gold-600 shadow-lg shadow-premium-gold-500/20"
                                )}
                            >
                                <ArrowRight size={18} /> Send Quote
                            </button>
                            <button
                                onClick={() => {
                                    if (existingAudit) navigate(`/audits/${existingAudit.id}`);
                                    else toast.error("Audit report not found");
                                }}
                                className="px-4 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-black hover:bg-slate-200 flex items-center justify-center gap-2 text-sm transition-all"
                            >
                                <FileText size={18} /> Report
                            </button>
                        </div>
                    )}

                    {lead.stage === 'proposal' && (
                        <button
                            onClick={() => moveLeadStage(lead.id, 'won')}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl font-black hover:bg-green-700 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                        >
                            <CheckCircle2 size={18} /> Accept Quote (Win)
                        </button>
                    )}

                    {lead.stage === 'won' && (
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleLaunchProject}
                                className="flex-1 px-5 py-2.5 bg-premium-blue-900 text-white rounded-xl font-black hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
                            >
                                <Rocket size={18} /> Launch Project
                            </button>
                            <Link to={`/sales/quotes/new?leadId=${lead.id}`} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm">
                                <FileText size={18} /> Edit Quote
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Audit Pending Banner */}
            {lead.auditPending && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-yellow-900">Site Audit Required</h3>
                            <p className="text-sm text-yellow-700">This lead is won but requires a site audit before a project can be created.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info Card */}
                <div className="space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-6">Engagement Intelligence</p>

                        <h3 className="text-sm font-black text-premium-blue-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Users size={14} className="text-slate-400" /> Contact Protocols
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all"><Mail size={18} /></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Electronic Mail</p>
                                    <p className="text-sm font-black text-premium-blue-900 truncate">{lead.email || 'Restricted'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all"><Phone size={18} /></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Direct Line</p>
                                    <p className="text-sm font-black text-premium-blue-900 truncate">{lead.phone || 'Restricted'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all"><MapPin size={18} /></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Deployment Location</p>
                                    <p className="text-xs font-black text-premium-blue-900 line-clamp-2 leading-tight">{lead.address || 'Unspecified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="my-8 border-t border-slate-100"></div>

                        <h3 className="text-sm font-black text-premium-blue-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <DollarSign size={14} className="text-slate-400" /> Capital Projection
                        </h3>
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Value</span>
                                <span className="text-lg font-black text-premium-gold-600 italic tracking-tighter">₦{Number(lead.value || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbound Source</span>
                                <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-600 uppercase tracking-widest">{lead.source || 'Organic'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Functional Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {((lead.serviceInterest?.length > 0) ? lead.serviceInterest : [lead.type || 'Lead']).map(tag => (
                                <span key={tag} className="px-3 py-1.5 rounded-xl bg-premium-blue-50 text-premium-blue-700 text-[10px] font-black uppercase tracking-widest border border-premium-blue-100 flex items-center gap-1.5">
                                    <Tag size={12} strokeWidth={3} /> {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs & Content */}
                <div className="lg:col-span-2 flex flex-col">
                    {/* Tabs: Intelligent Integrated Navigation */}
                    <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full">
                        <div className="bg-slate-50/50 border-b border-slate-100 px-4 sm:px-8 overflow-x-auto no-scrollbar">
                            <div className="flex gap-8 min-w-max">
                                {['Overview', 'Activity', 'Communication', 'Documents'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase())}
                                        className={clsx(
                                            "py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                                            activeTab === tab.toLowerCase() ? "text-premium-blue-900" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        {tab}
                                        {activeTab === tab.toLowerCase() && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-premium-gold-500 rounded-t-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 sm:p-8 flex-1 min-h-[500px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {showNextAction && (
                                        <div className="bg-blue-50 p-4 rounded-lg flex gap-4 items-start">
                                            <div className="p-2 bg-premium-blue-900 text-white rounded-lg mt-1"><CheckCircle2 size={18} /></div>
                                            <div>
                                                <h4 className="font-bold text-premium-blue-900">Next Action</h4>
                                                <p className="text-sm text-premium-blue-800">{nextActionText}</p>
                                            </div>
                                            {/* Redundant CTA removed for unification */}
                                        </div>
                                    )}

                                    {/* Stage Promotion Prompt */}
                                    {showStagePrompt && (
                                        <div className="bg-premium-gold-50 border border-premium-gold-200 p-4 rounded-xl flex gap-4 items-center animate-in slide-in-from-bottom-2">
                                            <div className="p-2 bg-premium-gold-500 text-white rounded-lg"><ArrowRight size={18} /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-premium-gold-900 text-sm">Action Complete!</h4>
                                                <p className="text-xs text-premium-gold-800">Would you like to move this lead to the <b>{PIPELINE_STAGES[PIPELINE_STAGES.findIndex(s => s.id === lead.stage) + 1]?.name}</b> stage?</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowStagePrompt(false)}
                                                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    No, Stay
                                                </button>
                                                <button
                                                    onClick={handlePromoteStage}
                                                    className="px-4 py-1.5 bg-premium-gold-500 text-white rounded-lg text-xs font-bold hover:bg-premium-gold-600 shadow-md animate-pop"
                                                >
                                                    Yes, Move Stage
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {lead.notes || `${lead.name} is interested in Primistine Electric's services. Contact them at ${lead.phone || lead.email} to discuss their requirements.`}
                                    </p>
                                    {lead.serviceInterest && lead.serviceInterest.length > 0 && (
                                        <div>
                                            <h4 className="font-bold text-slate-700 mb-2">Interested Services</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {lead.serviceInterest.map(service => (
                                                    <span key={service} className="px-3 py-1 rounded-full bg-premium-blue-50 text-premium-blue-700 text-xs font-medium">
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="space-y-6">
                                    <div className="flex gap-2 mb-6">
                                        <input
                                            type="text"
                                            placeholder="Add a note..."
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-premium-blue-500"
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                        />
                                        <button
                                            onClick={handleAddNote}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 text-sm"
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-slate-100">
                                        {activities.map(activity => (
                                            <div key={activity.id} className="relative pl-10">
                                                <div className={clsx("absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center",
                                                    activity.type === 'note' ? 'bg-yellow-100 text-yellow-600' :
                                                        activity.type === 'status' ? 'bg-blue-100 text-blue-600' :
                                                            activity.type === 'call' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                                                )}>
                                                    {activity.type === 'note' ? <FileText size={14} /> :
                                                        activity.type === 'status' ? <CheckCircle2 size={14} /> :
                                                            activity.type === 'call' ? <Phone size={14} /> : <Clock size={14} />}
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <p className="text-sm text-slate-700">{activity.text}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-xs font-bold text-slate-500">{activity.user}</span>
                                                        <span className="text-xs text-slate-400">{activity.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-premium-blue-400 hover:bg-slate-50 transition-all cursor-pointer">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                                            <Plus size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-premium-blue-900">Upload Document</p>
                                        <p className="text-xs text-slate-500">Drag & drop or Click to browse</p>
                                    </div>
                                    {documents.length === 0 ? (
                                        <p className="text-center text-slate-400 py-4">No documents uploaded yet.</p>
                                    ) : (
                                        documents.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText size={20} /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{doc.name}</p>
                                                        <p className="text-xs text-slate-400">{doc.size} • {doc.date}</p>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'communication' && (
                                <div className="text-center py-12 text-slate-400">
                                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-medium">No communications yet</p>
                                    <p className="text-sm">Emails and messages with this lead will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
