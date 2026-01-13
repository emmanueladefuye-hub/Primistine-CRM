import React, { useState } from 'react';
import { DollarSign, FileText, Send, CheckCircle } from 'lucide-react';

import { useInvoices } from '../../../contexts/InvoicesContext';
import Skeleton from '../../ui/Skeleton';
import CreateInvoiceModal from '../CreateInvoiceModal';
import { toast } from 'react-hot-toast';

export default function TabPayments({ project }) {
    const { invoices: allInvoices, loading, markAsPaid } = useInvoices();
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Filter for this project
    const invoices = allInvoices ? allInvoices.filter(inv => inv.projectId === project.id) : [];

    // Derived Calculations
    const parseCurrency = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.replace(/[^0-9.]/g, ''));
    };

    const totalValue = parseCurrency(project.value || project.systemSpecs?.value || 0);
    const paidAmount = invoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? (parseFloat(inv.total || inv.amount)) : 0), 0);
    const outstanding = Math.max(0, totalValue - paidAmount);
    const progress = totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0;

    const handleMarkPaid = async (id) => {
        const toastId = toast.loading("Processing payment...");
        try {
            await markAsPaid(id);
            toast.success("Payment recorded!", { id: toastId });
        } catch (err) {
            toast.error("Failed to record payment", { id: toastId });
        }
    };

    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-28 rounded-xl" count={3} />
            </div>
            <Skeleton className="h-64 rounded-xl" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard label="Project Value" value={`₦${totalValue.toLocaleString()}`} color="bg-slate-50 border-slate-200 text-slate-800" />
                <MetricCard label="Paid to Date" value={`₦${paidAmount.toLocaleString()}`} sub={`${progress}%`} color="bg-green-50 border-green-200 text-green-800" />
                <MetricCard label="Outstanding" value={`₦${outstanding.toLocaleString()}`} color="bg-amber-50 border-amber-200 text-amber-800" />
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Payment History</h3>
                    <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        <FileText size={16} /> Generate Invoice
                    </button>
                </div>

                {invoices.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No invoices generated yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Invoice #</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Amount</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Due Date</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Status</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50 group">
                                        <td className="px-6 py-4 font-mono text-slate-600 font-medium">{inv.invoiceNumber || inv.id.substring(0, 8)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">₦{(inv.total || inv.amount).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-500">{inv.dueDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={props => `px-2 py-1 rounded-full text-xs font-bold uppercase
                                                ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                    inv.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {inv.status === 'Paid' ? (
                                                    <button className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                                        <CheckCircle size={12} /> Paid
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkPaid(inv.id)}
                                                            className="text-xs font-bold text-slate-500 hover:text-green-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"
                                                        >
                                                            <DollarSign size={12} /> Record Pay
                                                        </button>
                                                        <button className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                                            <Send size={12} /> Remind
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateInvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                project={project}
            />
        </div>
    );
}

function MetricCard({ label, value, sub, color }) {
    return (
        <div className={`p-5 rounded-xl border flex flex-col justify-between h-28 ${color}`}>
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{value}</span>
                {sub && <span className="text-sm font-medium opacity-80 mb-1">{sub}</span>}
            </div>
        </div>
    );
}
