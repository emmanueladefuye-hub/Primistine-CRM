import React, { useState } from 'react';
import {
    Zap,
    Shield,
    Clock,
    CheckCircle2,
    ArrowRight,
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Linkedin
} from 'lucide-react';
import primistineLogo from '../assets/primistine-logo.png';
import { InquiryService } from '../lib/services/InquiryService';
import { toast } from 'react-hot-toast';

export default function PublicInquiryPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        serviceInterest: 'Solar',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Capture UTMs on mount
    const [attribution, setAttribution] = useState({});

    useState(() => {
        const params = new URLSearchParams(window.location.search);
        setAttribution({
            utm_source: params.get('utm_source') || 'website',
            utm_medium: params.get('utm_medium') || 'organic',
            utm_campaign: params.get('utm_campaign') || 'none',
            utm_term: params.get('utm_term') || '',
            utm_content: params.get('utm_content') || '',
            referrer: document.referrer || 'direct'
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await InquiryService.trackInquiry({
                ...formData,
                ...attribution,
                serviceInterest: [formData.serviceInterest]
            });
            setSubmitted(true);
            toast.success("Thank you! We'll contact you soon.");
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-premium-blue-900 flex items-center justify-center p-6 text-white text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-premium-gold-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-premium-gold-500/20">
                        <CheckCircle2 size={40} className="text-premium-blue-900" />
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tight">Inquiry Received</h1>
                    <p className="text-premium-blue-100 font-medium">Thank you for choosing Primistine Electric. Our engineering team is reviewing your request and will contact you within 24 hours.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                        Return to Site
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-premium-gold-500 selection:text-premium-blue-900">
            {/* Nav */}
            <nav className="p-6 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <img src={primistineLogo} alt="Logo" className="w-10 h-10" />
                    <span className="font-black text-premium-blue-900 text-xl tracking-tighter">PRIMISTINE</span>
                </div>
                <div className="hidden md:flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
                    <a href="#" className="hover:text-premium-blue-900 transition-colors">Solutions</a>
                    <a href="#" className="hover:text-premium-blue-900 transition-colors">Projects</a>
                    <a href="#" className="hover:text-premium-blue-900 transition-colors">Company</a>
                </div>
                <button className="px-6 py-3 bg-premium-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Get Started</button>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-24 items-center">
                {/* Left Content */}
                <div className="space-y-12">
                    <div className="space-y-6">
                        <span className="inline-block px-4 py-2 bg-premium-gold-500/10 text-premium-gold-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-premium-gold-500/20">
                            Revolutionizing Energy in Nigeria
                        </span>
                        <h1 className="text-6xl sm:text-7xl font-black text-premium-blue-900 tracking-tighter leading-[0.9] italic">
                            Premium <br /> Renewable <br /> <span className="text-premium-gold-500">Infrastructure.</span>
                        </h1>
                        <p className="max-w-md text-slate-500 font-medium leading-relaxed">
                            Primistine Electric Limited provides world-class electrical and renewable energy solutions for industrial, commercial, and residential deployments.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-premium-blue-600 shadow-xl shadow-slate-200/50 border border-slate-100"><Zap size={24} /></div>
                            <h4 className="font-black text-premium-blue-900 uppercase text-xs tracking-widest">Smart Grids</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Intelligent Distribution</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-premium-blue-600 shadow-xl shadow-slate-200/50 border border-slate-100"><Shield size={24} /></div>
                            <h4 className="font-black text-premium-blue-900 uppercase text-xs tracking-widest">Military Grade</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Unmatched Reliability</p>
                        </div>
                    </div>
                </div>

                {/* Right Form */}
                <div className="relative">
                    <div className="absolute -inset-4 bg-premium-gold-500/20 blur-3xl rounded-[60px] -z-10 animate-pulse"></div>
                    <div className="bg-white p-8 sm:p-12 rounded-[48px] shadow-2xl border border-slate-100">
                        <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight mb-8">Initiate Consultation</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" placeholder="John Doe" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Line</label>
                                    <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} type="tel" placeholder="+234" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Electronic Mail</label>
                                <input required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} type="email" placeholder="john@example.com" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Solution Interest</label>
                                <select value={formData.serviceInterest} onChange={e => setFormData({ ...formData, serviceInterest: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm">
                                    <option>Solar</option>
                                    <option>CCTV</option>
                                    <option>Electrical</option>
                                    <option>Industrial</option>
                                </select>
                            </div>
                            <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-premium-blue-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-premium-blue-900/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isSubmitting ? "Processing..." : <>Confirm Request <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12 mt-24">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <img src={primistineLogo} alt="Logo" className="w-8 h-8 opacity-50" />
                            <span className="font-black text-premium-blue-900/50 text-lg tracking-tighter">PRIMISTINE</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium">Delivering energy independence through excellence in engineering.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6">Contact</h4>
                        <div className="space-y-4 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-3"><Phone size={14} className="text-slate-300" /> +234 123 456 7890</div>
                            <div className="flex items-center gap-3"><Mail size={14} className="text-slate-300" /> info@primistine.com</div>
                            <div className="flex items-center gap-3"><MapPin size={14} className="text-slate-300" /> Lagos, Nigeria</div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6">Follow Us</h4>
                        <div className="flex gap-4 text-slate-400">
                            <Facebook size={18} className="hover:text-premium-blue-600 transition-colors cursor-pointer" />
                            <Linkedin size={18} className="hover:text-premium-blue-600 transition-colors cursor-pointer" />
                            <Instagram size={18} className="hover:text-premium-gold-500 transition-colors cursor-pointer" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
