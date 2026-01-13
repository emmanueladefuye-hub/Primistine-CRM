import React, { useState } from 'react';
import { X, FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInvoices } from '../../contexts/InvoicesContext';
import clsx from 'clsx';

export default function CreateInvoiceModal({ isOpen, onClose, project, client }) {
    const { addInvoice } = useInvoices();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        dueDate: '',
        description: 'Project Milestone Payment'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.amount || !formData.dueDate) {
                toast.error("Please fill in all required fields");
                setLoading(false);
                return;
            }

            const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

            await addInvoice({
                invoiceNumber: invoiceId,
                projectId: project.id,
                projectTitle: project.name,
                clientId: client?.id || project.client || 'Unknown',
                clientName: client?.name || project.clientInfo?.name || 'Client',
                total: parseFloat(formData.amount),
                dueDate: formData.dueDate, // String YYYY-MM-DD is fine for now, or convert to Timestamp
                description: formData.description,
                status: 'Pending',
                items: [{ description: formData.description, amount: parseFloat(formData.amount) }]
            });

            onClose();
            setFormData({ amount: '', dueDate: '', description: 'Project Milestone Payment' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-premium-blue-600" />
                        Generate Invoice
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Project Info */}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                        <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Billed To</p>
                            <p className="text-sm font-bold text-slate-700">{project.clientInfo?.name || client?.name || 'Current Client'}</p>
                            <p className="text-xs text-slate-500">{project.name}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                            placeholder="e.g. Initial Deposit (40%)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₦)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-premium-blue-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-premium-blue-800 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FileText size={18} /> Create Invoice
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
