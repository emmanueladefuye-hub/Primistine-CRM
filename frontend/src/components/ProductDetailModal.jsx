import React from 'react';
import { X, Edit, BarChart2, History, Tag } from 'lucide-react';

export default function ProductDetailModal({ isOpen, onClose, product }) {
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-300">
                            IMG
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">{product.category}</span>
                                <span className="text-slate-400 text-xs font-mono">{product.sku}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">{product.name}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <label className="text-xs font-bold text-slate-400 uppercase">Current Stock</label>
                            <div className="text-2xl font-bold text-premium-blue-900">{product.stock} Units</div>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <label className="text-xs font-bold text-slate-400 uppercase">Unit Price</label>
                            <div className="text-2xl font-bold text-slate-700">{product.price}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <label className="text-xs font-bold text-slate-400 uppercase">Total Value</label>
                            <div className="text-2xl font-bold text-slate-700">₦{(product.stock * parseInt(product.price.replace(/[^0-9]/g, ''))).toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Transaction History (Mock) */}
                    <div>
                        <h3 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                            <History size={18} /> Recent Transactions
                        </h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Qty</th>
                                        <th className="p-3">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-3 text-slate-500">2026-02-10</td>
                                        <td className="p-3"><span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold">Issue</span></td>
                                        <td className="p-3 font-bold text-slate-700">-12</td>
                                        <td className="p-3 text-slate-600">Project #102</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-3 text-slate-500">2026-01-28</td>
                                        <td className="p-3"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold">Receive</span></td>
                                        <td className="p-3 font-bold text-slate-700">+50</td>
                                        <td className="p-3 text-slate-600">PO-2026-005</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg flex items-center gap-2">
                        <Edit size={16} /> Edit Product
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-premium-blue-900 text-white font-medium rounded-lg hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
