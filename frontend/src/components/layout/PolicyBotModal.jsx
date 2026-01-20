import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function PolicyBotModal({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm the Staff Policy Bot. Ask me about leave, expenses, or safety protocols.", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Real AI Response via n8n
        try {
            // ------------------------------------------------------------------
            // AUTO-CONFIGURATION: Localhost Default
            // We assume n8n is running locally on port 5678.
            // ------------------------------------------------------------------
            // Use 'webhook-test' for testing content in n8n UI, 'webhook' for active workflows
            const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/policy-chat";

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, userId: 'USER_ID_HERE' }) // You can pass actual user ID
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error("n8n Workflow not active (404). Check if workflow is Active.");
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            // Expecting structure: { "choices": [ { "message": { "content": "..." } } ] } or simplified { "output": "..." }
            const aiText = data.output || data.choices?.[0]?.message?.content || (typeof data === 'string' ? data : JSON.stringify(data));

            setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, sender: 'bot' }]);

        } catch (error) {
            console.error("Bot Error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "❌ **Connection Error**\n\nCould not reach the AI Brain. Checking internet connection...", sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-premium-blue-900 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Bot size={24} className="text-premium-gold-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Staff Policy Assistant</h3>
                            <p className="text-xs text-blue-200 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online • RAG Enabled</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={clsx("flex gap-3", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.sender === 'user' ? "bg-slate-200 text-slate-600" : "bg-premium-blue-100 text-premium-blue-700"
                            )}>
                                {msg.sender === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                            </div>
                            <div className={clsx(
                                "max-w-[80%] p-3 rounded-2xl text-sm font-medium leading-relaxed",
                                msg.sender === 'user'
                                    ? "bg-slate-800 text-white rounded-tr-none"
                                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-premium-blue-100 text-premium-blue-700 flex items-center justify-center shrink-0">
                                <Sparkles size={16} />
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
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
                            className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-premium-blue-500/20"
                            placeholder="Ask about policies..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="bg-premium-blue-900 text-white p-3 rounded-xl hover:bg-premium-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
