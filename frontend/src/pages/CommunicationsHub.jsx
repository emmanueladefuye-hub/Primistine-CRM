import React, { useState } from 'react';
import { Mail, MessageSquare, Bell, Search, Star, Archive, MoreHorizontal, User } from 'lucide-react';
import clsx from 'clsx';

const MOCK_MESSAGES = [
    { id: 1, sender: 'Lekki Port Authority', subject: 'Maintenance Schedule Confirmation', preview: 'We have received your proposal for the Q1 maintenance schedule and...', time: '10:45 AM', unread: true, tag: 'Client' },
    { id: 2, sender: 'Tobi Adebayo', subject: 'Site Audit Photos - Grace Gardens', preview: 'Attached are the photos from the inverter room inspection yesterday.', time: 'Yesterday', unread: false, tag: 'Internal' },
    { id: 3, sender: 'System Notification', subject: 'Inventory Alert: Low Stock', preview: 'Warning: 550W Jinko Panels are below the minimum threshold.', time: 'Jan 4', unread: false, tag: 'System' },
    { id: 4, sender: 'Dangote Procurement', subject: 'Invoice #INV-2024-003 Payment', preview: 'Please find attached the proof of payment for the recent invoice.', time: 'Jan 3', unread: false, tag: 'Client' },
    { id: 5, sender: 'Sarah Okon', subject: 'New Lead: Victoria Island Mall', preview: 'I just spoke with the facility manager at VI Mall, they are interested in...', time: 'Jan 2', unread: false, tag: 'Internal' },
];

export default function CommunicationsHub() {
    const [activeTab, setActiveTab] = useState('inbox');
    const [filter, setFilter] = useState('all'); // all, Client, Internal, System
    const [selectedMessageId, setSelectedMessageId] = useState(MOCK_MESSAGES[0].id);
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    const filteredMessages = filter === 'all'
        ? MOCK_MESSAGES
        : MOCK_MESSAGES.filter(msg => msg.tag === filter);

    const selectedMessage = MOCK_MESSAGES.find(m => m.id === selectedMessageId) || MOCK_MESSAGES[0];

    const handleSelectMessage = (id) => {
        setSelectedMessageId(id);
        setShowMobileDetail(true);
    };

    return (
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900 tracking-tight">Communications</h1>
                    <p className="text-slate-500 font-medium text-sm">Centralized messages, emails, and alerts.</p>
                </div>
                <button className="w-full sm:w-auto bg-premium-blue-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 transition-all hover:-translate-y-0.5 whitespace-nowrap">
                    + Compose
                </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex relative">
                {/* Sidebar List */}
                <div className={clsx(
                    "w-full lg:w-96 border-r border-slate-100 flex flex-col transition-all duration-300",
                    showMobileDetail ? "hidden lg:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-slate-100 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-gold-500 transition-colors" size={16} />
                            <input type="text" placeholder="Search messages..." className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-premium-gold-400/50 text-sm font-medium transition-all" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {['all', 'Client', 'Internal', 'System'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilter(tag)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                                        filter === tag
                                            ? "bg-premium-blue-900 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {tag === 'all' ? 'All' : tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => handleSelectMessage(msg.id)}
                                className={clsx(
                                    "p-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all",
                                    msg.unread ? "bg-blue-50/30" : "",
                                    selectedMessageId === msg.id ? "bg-blue-50/80 border-l-4 border-l-premium-blue-600" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className={clsx("font-bold text-sm truncate pr-2", msg.unread ? "text-premium-blue-900" : "text-slate-700")}>{msg.sender}</span>
                                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">{msg.time}</span>
                                </div>
                                <h4 className={clsx("text-xs font-bold mb-1.5 truncate", msg.unread ? "text-slate-900" : "text-slate-600")}>{msg.subject}</h4>
                                <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">{msg.preview}</p>
                                <div className="mt-2.5">
                                    <span className={clsx("text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                                        msg.tag === 'Client' ? "bg-blue-100 text-blue-700" :
                                            msg.tag === 'System' ? "bg-rose-100 text-rose-700" :
                                                "bg-slate-100 text-slate-600"
                                    )}>{msg.tag}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Detail View */}
                <div className={clsx(
                    "flex-1 flex flex-col transition-all duration-300 bg-white",
                    showMobileDetail ? "flex" : "hidden lg:flex"
                )}>
                    {/* Message Header */}
                    <div className="p-4 sm:p-6 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowMobileDetail(false)}
                                    className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                                <div className="w-10 h-10 rounded-full bg-premium-blue-100 flex items-center justify-center text-premium-blue-700 font-extrabold shrink-0">
                                    {selectedMessage.sender.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-black text-premium-blue-900 truncate leading-tight">{selectedMessage.subject}</h2>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                        <span className="text-xs font-bold text-slate-700">{selectedMessage.sender}</span>
                                        <span className="hidden sm:inline text-slate-300">•</span>
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium italic truncate max-w-[150px] sm:max-w-none">admin@lekkiport.com</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"><Star size={18} /></button>
                                <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"><Archive size={18} /></button>
                                <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"><MoreHorizontal size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium">
                            <p>Dear Primistine Team,</p>
                            <p>We have received your proposal for the Q1 maintenance schedule and we are happy to proceed with the dates suggested (Jan 15th - Jan 18th).</p>
                            <p>Please ensure all technicians have their port passes renewed before arrival. If you need any assistance with the clearance process, let us know by Tuesday.</p>
                            <p>Best regards,<br /><span className="font-bold text-slate-800">Facility Management</span></p>

                            <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xs transition-shadow hover:shadow-md cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-500 group-hover:scale-110 transition-transform"><FileText size={20} className="w-5 h-5" /></div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">Q1_Maintenance_Plan.pdf</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2.4 MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reply Box */}
                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-white">
                        <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-premium-gold-400/30 focus-within:bg-white">
                            <textarea className="w-full text-sm font-medium text-slate-700 bg-transparent resize-none focus:outline-none min-h-[80px]" placeholder="Type your reply here..."></textarea>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                                <div className="flex gap-2">
                                    {/* Action icons could go here */}
                                </div>
                                <button className="bg-premium-blue-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-premium-blue-800 shadow-md transition-all hover:-translate-y-0.5">
                                    Send Reply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icon
const FileText = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
)
