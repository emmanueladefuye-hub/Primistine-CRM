import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, Book, Briefcase, Shield, HardHat, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const BOT_MODES = [
    { id: 'policy', label: 'HR & Policy', icon: Book, color: 'bg-blue-50 text-blue-600', greeting: "Hi! I'm the Staff Policy Bot. Ask me about leave, expenses, or company policies." },
    { id: 'project', label: 'Project Intel', icon: Briefcase, color: 'bg-emerald-50 text-emerald-600', greeting: "Hello! I have access to your live CRM data. Ask me about project statuses, lead counts, or pending tasks." },
    { id: 'safety', label: 'Safety Protocols', icon: Shield, color: 'bg-amber-50 text-amber-600', greeting: "Safety First! I can help you with PPE requirements, hazard protocols, and compliance checklists." },
    { id: 'technical', label: 'Technical Specs', icon: Zap, color: 'bg-purple-50 text-purple-600', greeting: "Technical mode activated. Ask me about inverter specifications, battery sizing, or installation standards." }
];

export default function PolicyBotModal({ isOpen, onClose, initialMode = 'policy' }) {
    const { currentUser, userProfile } = useAuth();
    const [activeMode, setActiveMode] = useState(initialMode);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef(null);

    // Reset messages when mode changes
    useEffect(() => {
        const currentMode = BOT_MODES.find(m => m.id === activeMode);
        setMessages([
            { id: 1, text: currentMode?.greeting || "Hello! How can I help you?", sender: 'bot' }
        ]);
    }, [activeMode]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const currentMode = BOT_MODES.find(m => m.id === activeMode);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/policy-chat";

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    userId: currentUser?.uid || 'anonymous',
                    userRole: userProfile?.role || 'guest',
                    mode: activeMode,
                    context: activeMode // The n8n workflow can use this to adjust prompts
                })
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error("n8n Workflow not active (404). Check if workflow is Active.");
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            const aiText = data.output || data.choices?.[0]?.message?.content || (typeof data === 'string' ? data : JSON.stringify(data));

            setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, sender: 'bot' }]);

        } catch (error) {
            console.error("Bot Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "❌ **Connection Error**\n\nCould not reach the AI Brain. Ensure n8n is running and the workflow is active.",
                sender: 'bot'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[650px] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-premium-blue-900 to-premium-blue-800 p-5 text-white">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl ring-2 ring-white/10">
                                <Bot size={28} className="text-premium-gold-400" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight">CRM Super-Agent</h3>
                                <p className="text-xs text-blue-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Online • {currentMode?.label} Mode
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                        {BOT_MODES.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setActiveMode(mode.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                                    activeMode === mode.id
                                        ? "bg-white text-premium-blue-900 shadow-lg"
                                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                                )}
                            >
                                <mode.icon size={14} />
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={clsx("flex gap-3", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={clsx(
                                "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0",
                                msg.sender === 'user' ? "bg-slate-200 text-slate-600" : currentMode?.color || "bg-premium-blue-100 text-premium-blue-700"
                            )}>
                                {msg.sender === 'user' ? <User size={18} /> : <currentMode.icon size={18} />}
                            </div>
                            <div className={clsx(
                                "max-w-[80%] p-4 rounded-[1.25rem] text-sm font-medium leading-relaxed",
                                msg.sender === 'user'
                                    ? "bg-slate-800 text-white rounded-tr-sm"
                                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                            )}>
                                <span className="whitespace-pre-line">{msg.text}</span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className={clsx("w-9 h-9 rounded-2xl flex items-center justify-center shrink-0", currentMode?.color)}>
                                <currentMode.icon size={18} />
                            </div>
                            <div className="bg-white border border-slate-200 p-4 rounded-[1.25rem] rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={endRef}></div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-slate-50 border-0 rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-premium-blue-500/20"
                            placeholder={`Ask about ${currentMode?.label.toLowerCase()}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="bg-premium-blue-900 text-white p-3.5 rounded-2xl hover:bg-premium-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-premium-blue-900/20"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
