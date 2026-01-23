import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function LeadInfoCard({ lead }) {
    if (!lead) return null;
    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl">
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-6">Engagement Intelligence</p>
            <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all"><Mail size={18} /></div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Electronic Mail</p>
                        <p className="text-sm font-black text-premium-blue-900 truncate">{lead.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all"><Phone size={18} /></div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Direct Line</p>
                        <p className="text-sm font-black text-premium-blue-900 truncate">{lead.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all"><MapPin size={18} /></div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Deployment Location</p>
                        <p className="text-xs font-black text-premium-blue-900 line-clamp-2 leading-tight">{lead.address}</p>
                    </div>
                </div>
            </div>

            <div className="my-8 border-t border-slate-100"></div>

            <h3 className="text-sm font-black text-premium-blue-900 uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                Capital Projection
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
    );
}
