import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mail, MessageSquare, Bell, Search, Star, Archive, MoreHorizontal, User, FileText, Send, X, Circle, Hash, ShieldCheck, Users } from 'lucide-react';
import clsx from 'clsx';
import { useMessages } from '../contexts/MessagesContext';
import VirtualList from '../components/common/VirtualList';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../components/ErrorBoundary';

const formatMessageTime = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return format(d, 'h:mm a');
    return format(d, 'MMM d');
};

export default function CommunicationsHub() {
    const {
        messages,
        channels,
        pagedMessages,
        messagesHasMore,
        loadMoreMessages,
        sendMessage,
        setTyping,
        typingUsers
    } = useMessages();
    const { userProfile, currentUser } = useAuth();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedThreadId, setSelectedThreadId] = useState(null);
    const [showMobileDetail, setShowMobileDetail] = useState(false);
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [presenceData, setPresenceData] = useState({});
    const chatEndRef = useRef(null);

    // Fetch Presence Data
    useEffect(() => {
        const presenceRef = ref(rtdb, 'status');
        const unsubscribe = onValue(presenceRef, (snapshot) => {
            setPresenceData(snapshot.val() || {});
        });
        return () => unsubscribe();
    }, []);

    // Unified message source (Live + Historical)
    const allMessages = useMemo(() => {
        const combined = [...(pagedMessages || []), ...(messages || [])];
        return Array.from(new Map(combined.map(m => [m.id, m])).values())
            .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    }, [pagedMessages, messages]);

    // Scroll to bottom on new message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages, selectedThreadId]);

    const threads = allMessages.reduce((acc, msg) => {
        const threadId = msg.threadId || `direct_${msg.id}`;
        if (!acc[threadId]) {
            acc[threadId] = {
                id: threadId,
                lastMessage: msg,
                messages: [],
                tag: msg.tag,
                participants: msg.participants || []
            };
        }
        acc[threadId].messages.push(msg);
        return acc;
    }, {});

    const threadList = Object.values(threads).sort((a, b) => {
        const timeA = a.lastMessage.createdAt?.toDate?.() || new Date(a.lastMessage.createdAt);
        const timeB = b.lastMessage.createdAt?.toDate?.() || new Date(b.lastMessage.createdAt);
        return timeB - timeA;
    });

    const filteredThreads = threadList.filter(thread => {
        const matchesType = filter === 'all' || thread.tag === filter;
        const matchesSearch =
            (thread.lastMessage.senderName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (thread.lastMessage.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const activeThread = selectedThreadId ? threads[selectedThreadId] : (filteredThreads[0] || null);

    const handleSelectThread = (id) => {
        setSelectedThreadId(id);
        setShowMobileDetail(true);
        // Mark all messages in thread as read
        threads[id].messages.forEach(m => {
            if (m.unread && m.senderId !== currentUser?.uid) markAsRead(m.id);
        });
    };

    return (
        <ErrorBoundary>
            <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col space-y-4 md:space-y-6 overflow-hidden">
                <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                    <div>
                        <h1 className="text-2xl font-black text-premium-blue-900 tracking-tight flex items-center gap-2">
                            Communications
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Real-time command center for team & clients.</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setIsComposeModalOpen(true)}
                            className="flex-1 sm:flex-none bg-premium-blue-900 text-premium-gold-400 px-6 py-3 rounded-xl text-sm font-black hover:bg-premium-blue-800 shadow-xl shadow-premium-blue-900/20 transition-all hover:-translate-y-0.5 whitespace-nowrap flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={18} />
                            New Chat
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden flex relative min-h-0">
                    {/* Sidebar - Channels & Directs */}
                    <div className={clsx(
                        "w-full lg:w-[380px] border-r border-slate-100 flex flex-col transition-all duration-300",
                        showMobileDetail ? "hidden lg:flex" : "flex"
                    )}>
                        <div className="p-6 border-b border-slate-100 space-y-4 bg-slate-50/50">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-blue-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-premium-blue-400/10 focus:border-premium-blue-400 text-sm font-bold transition-all placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {['all', 'Internal', 'Client', 'System'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setFilter(tag)}
                                        className={clsx(
                                            "px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2",
                                            filter === tag
                                                ? "bg-premium-blue-900 text-white shadow-lg shadow-premium-blue-900/20"
                                                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                                        )}
                                    >
                                        {tag === 'all' ? <Users size={14} /> : tag === 'Internal' ? <ShieldCheck size={14} /> : tag === 'Client' ? <User size={14} /> : <Bell size={14} />}
                                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                            {/* Group Channels Section */}
                            {channels.length > 0 && (
                                <div className="py-2">
                                    <p className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Channels</p>
                                    {channels.map(channel => (
                                        <div
                                            key={channel.id}
                                            onClick={() => handleSelectThread(channel.id)}
                                            className={clsx(
                                                "px-6 py-3 hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-3",
                                                selectedThreadId === channel.id ? "bg-premium-blue-50 border-r-4 border-r-premium-blue-600" : ""
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Hash size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{channel.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-50">Direct Messages</p>
                            {filteredThreads.map((thread) => {
                                const isSelect = selectedThreadId === thread.id;
                                const unreadCount = thread.messages.filter(m => m.unread && m.senderId !== currentUser?.uid).length;
                                const lastMsg = thread.lastMessage;
                                const isOnline = presenceData[lastMsg.senderId]?.state === 'online';

                                return (
                                    <div
                                        key={thread.id}
                                        onClick={() => handleSelectThread(thread.id)}
                                        className={clsx(
                                            "p-5 hover:bg-slate-50 cursor-pointer transition-all group flex items-start gap-4 active:scale-95",
                                            isSelect ? "bg-premium-blue-50/50 border-r-4 border-r-premium-blue-600" : "bg-white"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-premium-blue-100 to-premium-blue-50 flex items-center justify-center text-premium-blue-700 font-black text-lg border border-premium-blue-100/50">
                                                {lastMsg.senderName?.charAt(0)}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-black text-sm text-slate-900 truncate pr-4 group-hover:text-premium-blue-900 transition-colors">{lastMsg.senderName}</h4>
                                                <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{formatMessageTime(lastMsg.createdAt)}</span>
                                            </div>
                                            <p className="text-xs font-bold text-premium-blue-800 mb-1 truncate">{lastMsg.subject}</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-500 line-clamp-1 italic font-medium">
                                                    {typingUsers[thread.id] && Object.keys(typingUsers[thread.id]).length > 0
                                                        ? 'Typing...'
                                                        : lastMsg.body}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="bg-premium-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-premium-blue-600/30">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Chat Interface */}
                    <div className={clsx(
                        "flex-1 flex flex-col transition-all duration-300 bg-white",
                        showMobileDetail ? "flex" : "hidden lg:flex"
                    )}>
                        {activeThread ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setShowMobileDetail(false)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                                            <Send className="rotate-180" size={20} />
                                        </button>
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-2xl bg-premium-blue-900 text-premium-gold-400 flex items-center justify-center font-black">
                                                {activeThread.lastMessage.senderName?.charAt(0)}
                                            </div>
                                            {presenceData[activeThread.lastMessage.senderId]?.state === 'online' && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                                {activeThread.lastMessage.senderName}
                                                {activeThread.tag === 'Internal' && <ShieldCheck size={14} className="text-premium-blue-600" />}
                                            </h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                                {presenceData[activeThread.lastMessage.senderId]?.state === 'online' ? (
                                                    <span className="text-green-500">Active Now</span>
                                                ) : (
                                                    <span>Last seen {formatMessageTime(presenceData[activeThread.lastMessage.senderId]?.last_changed)}</span>
                                                )}
                                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                                <span>{activeThread.tag} Channel</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all"><Star size={20} /></button>
                                        <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all"><Archive size={20} /></button>
                                        <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all"><MoreHorizontal size={20} /></button>
                                    </div>
                                </div>

                                {/* Message Area */}
                                <div className="flex-1 bg-slate-50/20">
                                    <VirtualList
                                        items={allMessages.filter(m => m.threadId === activeThread.id).sort((a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0))}
                                        itemHeight={80} // Estimated average height
                                        buffer={10}
                                        className="p-6 custom-scrollbar"
                                        renderItem={(msg, idx) => {
                                            const isMe = msg.senderId === currentUser?.uid;
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={msg.id || idx}
                                                    className={clsx(
                                                        "max-w-[75%] flex flex-col mb-6",
                                                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "px-5 py-3.5 rounded-3xl shadow-sm text-sm font-medium leading-relaxed mb-1.5",
                                                        isMe
                                                            ? "bg-premium-blue-900 text-white rounded-br-none"
                                                            : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                                                    )}>
                                                        {msg.body}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mx-2">
                                                        {formatMessageTime(msg.createdAt)} {isMe && '• Seen'}
                                                    </span>
                                                </motion.div>
                                            );
                                        }}
                                    />
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-6 bg-white border-t border-slate-100">
                                    <AnimatePresence>
                                        {typingUsers[activeThread.id] && Object.keys(typingUsers[activeThread.id]).filter(uid => uid !== currentUser.uid).length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="ml-2 mb-3 text-[10px] font-black text-premium-blue-600 italic flex items-center gap-2"
                                            >
                                                <span className="flex gap-1">
                                                    <span className="w-1 h-1 bg-premium-blue-400 rounded-full animate-bounce"></span>
                                                    <span className="w-1 h-1 bg-premium-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                    <span className="w-1 h-1 bg-premium-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                                </span>
                                                Someone is typing...
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <ChatInput
                                        onSend={(body) => sendMessage({
                                            subject: activeThread.lastMessage.subject,
                                            body,
                                            recipientId: activeThread.lastMessage.senderId === currentUser.uid
                                                ? activeThread.lastMessage.recipientId
                                                : activeThread.lastMessage.senderId,
                                            threadId: activeThread.id,
                                            tag: activeThread.tag
                                        })}
                                        onTyping={(isTyping) => setTyping(activeThread.id, isTyping)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6">
                                <div className="w-24 h-24 rounded-[40px] bg-slate-50 flex items-center justify-center border-4 border-white shadow-inner">
                                    <MessageSquare size={48} className="text-slate-200" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-black text-slate-900">Your Communication Hub</h3>
                                    <p className="text-sm font-bold text-slate-400 max-w-[280px]">Select a conversation from the sidebar to start instant messaging.</p>
                                </div>
                                <button
                                    onClick={() => setIsComposeModalOpen(true)}
                                    className="bg-premium-blue-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-premium-blue-800 transition-all shadow-xl shadow-premium-blue-900/10"
                                >
                                    Start New Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isComposeModalOpen && (
                    <ComposeModal
                        onClose={() => setIsComposeModalOpen(false)}
                        onSend={sendMessage}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}

function ChatInput({ onSend, onTyping }) {
    const [body, setBody] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (!body.trim()) return;
        onSend(body.trim());
        setBody('');
        onTyping(false);
    };

    const handleChange = (e) => {
        setBody(e.target.value);
        onTyping(true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 3000);
    };

    return (
        <div className="relative flex items-end gap-3 bg-slate-50 p-3 rounded-[24px] border border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-premium-blue-400/10 focus-within:border-premium-blue-400 transition-all">
            <textarea
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold p-2 min-h-[44px] max-h-[120px] resize-none placeholder:text-slate-400"
                placeholder="Type a message..."
                value={body}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                rows={1}
            />
            <button
                onClick={handleSend}
                disabled={!body.trim()}
                className="p-3.5 rounded-2xl bg-premium-blue-900 text-premium-gold-400 hover:bg-premium-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
            >
                <Send size={18} />
            </button>
        </div>
    );
}

function ComposeModal({ onClose, onSend }) {
    const [formData, setFormData] = useState({ subject: '', body: '', tag: 'Internal', recipientId: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSend(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-premium-blue-900">Start Conversation</h2>
                        <p className="text-xs font-bold text-slate-400">Initialize a new secure thread.</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100 shadow-sm">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel Type</label>
                        <div className="flex gap-3">
                            {['Internal', 'Client', 'System'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tag }))}
                                    className={clsx(
                                        "flex-1 py-3.5 rounded-2xl text-xs font-black transition-all border-2",
                                        formData.tag === tag
                                            ? "bg-premium-blue-900 border-premium-blue-900 text-premium-gold-400 shadow-xl shadow-premium-blue-900/20"
                                            : "bg-white border-slate-100 text-slate-500 hover:border-premium-blue-200"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <input
                            type="text"
                            required
                            value={formData.subject}
                            onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-premium-blue-400 focus:ring-0 text-sm font-bold transition-all placeholder:text-slate-300"
                            placeholder="e.g. Project Solar Update"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Message</label>
                        <textarea
                            required
                            value={formData.body}
                            onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
                            className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-premium-blue-400 focus:ring-0 text-sm font-bold transition-all min-h-[160px] resize-none placeholder:text-slate-300"
                            placeholder="Type your message here..."
                        ></textarea>
                    </div>
                    <div className="pt-4 flex gap-4">
                        <button type="submit" className="flex-1 py-4 rounded-[20px] bg-premium-blue-900 text-premium-gold-400 text-sm font-black hover:bg-premium-blue-800 shadow-2xl shadow-premium-blue-900/40 transition-all hover:-translate-y-1">
                            Dispatch Message
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
