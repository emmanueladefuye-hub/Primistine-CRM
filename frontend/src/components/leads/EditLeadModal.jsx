import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PIPELINE_STAGES } from '../../lib/constants';

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

export default function EditLeadModal({ isOpen, onClose, lead, onSave }) {
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
        const interest = formData.serviceInterest?.[0];
        const serviceKey = mapServiceInterestToKey(interest);
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-premium-blue-900">Lead Won! 🚀</h2>
                        <p className="text-slate-600">
                            Congratulations! Standard procedure requires a <span className="font-bold text-premium-blue-900">Site Audit</span> before a project can be created.
                        </p>
                        <div className="flex flex-col gap-3 mt-6">
                            <button onClick={handleScheduleAudit} className="w-full py-3 bg-premium-blue-900 text-white rounded-xl font-bold hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 flex items-center justify-center gap-2">
                                <FileText size={18} /> Schedule Site Audit Now
                            </button>
                            <button onClick={handleLater} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50">
                                Do it Later (Mark as Audit Pending)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
                        <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Company</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                            <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
                            <input type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Value</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Stage</label>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })}>
                                {PIPELINE_STAGES.map((stage, idx) => {
                                    const currentIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
                                    const isDisabled = idx > currentIdx + 1;
                                    return <option key={stage.id} value={stage.id} disabled={isDisabled}>{stage.name}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Service Interest</label>
                        <div className="flex flex-wrap gap-2">
                            {['Solar & Inverter', 'CCTV & Security', 'Electrical Wiring', 'Generator / ATS', 'Earthing & Surge', 'Industrial Safety'].map(service => (
                                <button
                                    key={service}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, serviceInterest: [service] }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formData.serviceInterest.includes(service)
                                        ? 'bg-premium-blue-900 text-white border-premium-blue-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {service}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-slate-100 p-6 flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-premium-blue-900 text-white rounded-lg font-bold hover:bg-premium-blue-800 shadow-lg">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
