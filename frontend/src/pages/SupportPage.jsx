import React from 'react';
import { HelpCircle, Book, MessageCircle, ExternalLink, ChevronDown } from 'lucide-react';

const FAQS = [
    { q: 'How do I add a new lead to the CRM?', a: 'Navigate to the Sales Dashboard and click the "+ Add Lead" button in the top right corner. Fill out the required information in the popup form.' },
    { q: 'Can I export the inventory report?', a: 'Yes, go to the Inventory Dashboard. There is an "Export" button in the toolbar that allows you to download a CSV or PDF report of current stock levels.' },
    { q: 'How do I reset my password?', a: 'Go to Settings > Security & Password. You can request a password reset link or change it directly if you know your current password.' },
    { q: 'What happens when a project is marked "Completed"?', a: 'It moves to the archive view by default, but you can still access it via the project history filter. All final documentation is automatically generated.' },
];

export default function SupportPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center py-8">
                <h1 className="text-3xl font-bold text-premium-blue-900 mb-2">How can we help you?</h1>
                <p className="text-slate-500">Search our knowledge base or contact support.</p>
                <div className="max-w-lg mx-auto mt-6 relative">
                    <input type="text" placeholder="Search for answers..." className="w-full pl-6 pr-4 py-3 rounded-full border border-slate-200 shadow-sm focus:ring-2 focus:ring-premium-gold-400 focus:outline-none" />
                    <button className="absolute right-2 top-2 bg-premium-blue-900 text-white p-2 rounded-full hover:bg-premium-blue-800">
                        <SearchIcon size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center group hover:border-premium-blue-200 transition-colors">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle size={24} />
                    </div>
                    <h3 className="font-bold text-premium-blue-900 mb-2">Live Chat</h3>
                    <p className="text-sm text-slate-500 mb-4">Chat with our support team in real-time.</p>
                    <button className="text-sm font-medium text-premium-blue-600 hover:underline">Start Chat</button>
                </div>

                {/* Docs Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center group hover:border-premium-blue-200 transition-colors">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Book size={24} />
                    </div>
                    <h3 className="font-bold text-premium-blue-900 mb-2">Documentation</h3>
                    <p className="text-sm text-slate-500 mb-4">Detailed guides and API references.</p>
                    <button className="text-sm font-medium text-premium-blue-600 hover:underline">Browse Docs</button>
                </div>

                {/* Email Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center group hover:border-premium-blue-200 transition-colors">
                    <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <HelpCircle size={24} />
                    </div>
                    <h3 className="font-bold text-premium-blue-900 mb-2">Email Support</h3>
                    <p className="text-sm text-slate-500 mb-4">Get a response within 24 hours.</p>
                    <button className="text-sm font-medium text-premium-blue-600 hover:underline">support@primistine.com</button>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-xl text-premium-blue-900">Frequently Asked Questions</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {FAQS.map((faq, i) => (
                        <div key={i} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-800">{faq.q}</h4>
                                <ChevronDown size={18} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-600">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const SearchIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
)
