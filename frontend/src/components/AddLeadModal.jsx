import React, { useState } from 'react';
import { X, Upload, Check } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function AddLeadModal({ isOpen, onClose, onAddLead }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        type: 'individual', // individual or corporate
        serviceInterest: [],
        budget: '',
        timeline: 'immediate',
        source: 'website',
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const SERVICE_INTERESTS = ['Solar & Inverter', 'CCTV & Security', 'Electrical Wiring', 'Generator / ATS', 'Earthing & Surge', 'Industrial Safety'];

    const handleServiceSelect = (interest) => {
        setFormData(prev => ({ ...prev, serviceInterest: [interest] }));
    };

    // Map budget range to estimated value
    const getBudgetValue = (budget) => {
        switch (budget) {
            case '<1M': return { value: '₦500,000', rawValue: 500000 };
            case '1M-5M': return { value: '₦3,000,000', rawValue: 3000000 };
            case '5M-20M': return { value: '₦12,000,000', rawValue: 12000000 };
            case '20M+': return { value: '₦25,000,000', rawValue: 25000000 };
            default: return { value: '₦0', rawValue: 0 };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.serviceInterest.length === 0) {
            toast.error("Please select a service interest");
            return;
        }

        setIsSubmitting(true);

        try {
            // Create new lead object
            const budgetInfo = getBudgetValue(formData.budget);
            const { createLead } = await import('../services/firestore');

            const newLead = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                value: budgetInfo.value,
                rawValue: budgetInfo.rawValue,
                stage: 'new', // New leads always start in 'new' stage
                company: formData.company || (formData.type === 'individual' ? 'Private Client' : 'Corporate'),
                lastContact: 'Just now',
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                source: formData.source === 'website' ? 'Website' : formData.source,
                type: formData.type === 'individual' ? 'Residential' : 'Commercial',
                notes: formData.notes,
                serviceInterest: formData.serviceInterest,
                createdAt: new Date().toISOString()
            };

            await createLead(newLead);

            if (onAddLead) onAddLead(); // Optional callback just for closing/refreshing logic if needed
            onClose();
            toast.success("Lead created successfully");
        } catch (error) {
            console.error("Failed to create lead", error);
            toast.error("Failed to create lead");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-premium-blue-900">Add New Lead</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form id="add-lead-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client Type Toggle */}
                    <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'individual' })}
                            className={clsx("px-4 py-2 rounded-md text-sm font-medium transition-all",
                                formData.type === 'individual' ? "bg-white text-premium-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'corporate' })}
                            className={clsx("px-4 py-2 rounded-md text-sm font-medium transition-all",
                                formData.type === 'corporate' ? "bg-white text-premium-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Corporate
                        </button>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">First Name</label>
                            <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Last Name</label>
                            <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                            <input required type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                            <input required type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                placeholder="Full Address (Optional)"
                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>

                    {formData.type === 'corporate' && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Company Name</label>
                            <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                                value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                        </div>
                    )}

                    {/* Services Interest */}
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
                                    className={clsx("px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                                        formData.serviceInterest.includes(service)
                                            ? "bg-premium-blue-50 border-premium-blue-200 text-premium-blue-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                    )}
                                >
                                    {service}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Deal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Budget Range (User Estimate)</label>
                            <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900 bg-white"
                                value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}>
                                <option value="">Select Range</option>
                                <option value="<1M">Below ₦1,000,000</option>
                                <option value="1M-5M">₦1,000,000 - ₦5,000,000</option>
                                <option value="5M-20M">₦5,000,000 - ₦20,000,000</option>
                                <option value="20M+">Above ₦20,000,000</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Project Timeline</label>
                            <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900 bg-white"
                                value={formData.timeline} onChange={e => setFormData({ ...formData, timeline: e.target.value })}>
                                <option value="immediate">Immediately (Urgent)</option>
                                <option value="1month">Within 1 Month</option>
                                <option value="3months">Within 3 Months</option>
                                <option value="planning">Just Planning</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Notes / Requirements</label>
                        <textarea required rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            placeholder="Any specific details mentioned by the client..."
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </form>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-3 z-10">
                    <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="add-lead-form" disabled={isSubmitting} className="px-5 py-2.5 bg-premium-blue-900 text-white rounded-lg font-bold hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 transition-all flex items-center gap-2">
                        {isSubmitting ? 'Saving...' : 'Create Lead'}
                    </button>
                </div>
            </div >
        </div >
    );
}
