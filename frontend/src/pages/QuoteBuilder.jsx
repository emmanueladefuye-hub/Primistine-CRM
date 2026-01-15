import React, { useState, useEffect } from 'react';
import './QuoteBuilder.css';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Check, User, Zap, DollarSign, FileText, Search, Trash2, Mail } from 'lucide-react';
import clsx from 'clsx';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import primistineLogo from '../assets/primistine-logo.png';
import { useLeads } from '../contexts/LeadsContext';
import { useClients } from '../contexts/ClientsContext';
import { useInventory } from '../contexts/InventoryContext';
import AddQuoteItemModal from '../components/quotes/AddQuoteItemModal';
import { createQuote, createProject } from '../services/firestore';
import { serverTimestamp } from 'firebase/firestore';

export default function QuoteBuilder() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const leadId = searchParams.get('leadId');
    const { getLeadById } = useLeads();
    const { clients } = useClients();
    const { inventory } = useInventory();

    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(!!id);

    // Form State
    const [client, setClient] = useState(null);
    const [clientSearch, setClientSearch] = useState('');
    const [systemConfig, setSystemConfig] = useState({
        backupHours: 8,
        dailyLoad: 12000,
    });

    // Pricing State
    const [items, setItems] = useState([]);
    const [laborCost, setLaborCost] = useState(150000);
    const [discount, setDiscount] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

    // Filtered Clients for Search
    const filteredClients = clientSearch
        ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
        : clients.slice(0, 5); // Show recent 5 if no search

    // Pre-fill client from lead if leadId is provided
    useEffect(() => {
        if (leadId && !client) {
            const lead = getLeadById(leadId);
            if (lead) {
                setClient({
                    id: lead.id,
                    name: lead.name,
                    type: lead.type || 'Lead',
                    address: lead.address || 'Address not specified',
                    email: lead.email,
                    phone: lead.phone
                });
                toast.success(`Creating quote for ${lead.name}`);
            }
        }
    }, [leadId, getLeadById, client]);

    // Fetch Linked Data
    useEffect(() => {
        if (!id) return;

        const fetchQuote = async () => {
            try {
                const docRef = doc(db, 'quotes', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // Populate State
                    setClient({
                        id: data.clientId,
                        name: data.clientName,
                        type: 'Client (Imported)',
                        address: data.address || 'Address not found'
                    });

                    if (data.equipment && Array.isArray(data.equipment)) {
                        const safeItems = data.equipment.map((item, idx) => {
                            const p = Number(item.unitPrice);
                            const q = Number(item.quantity);
                            return {
                                id: `import-${idx}`,
                                sku: item.sku || 'N/A',
                                name: item.item || 'Unknown Item',
                                price: isNaN(p) ? 0 : p,
                                qty: isNaN(q) ? 1 : q,
                                category: item.category || 'General'
                            };
                        });
                        setItems(safeItems);
                    }
                    /* ... existing config loading ... */
                    // Not modifying this part currently
                    if (data.specs && data.specs.solar) {
                        const solarVal = Number(data.specs.solar);
                        setSystemConfig({
                            backupHours: 8,
                            dailyLoad: isNaN(solarVal) ? 0 : (solarVal * 1000) * 5.5,
                        });
                    } else {
                        setSystemConfig({
                            backupHours: 8,
                            dailyLoad: 0,
                        });
                    }

                    setStep(3); // Jump to Pricing step if imported
                    toast.success('Audit data imported successfully!');
                }
            } catch (err) {
                console.error("Error fetching quote:", err);
                toast.error("Failed to load quote data.");
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, [id]);

    const STEPS = [
        { id: 1, name: 'Client Info', icon: User },
        { id: 2, name: 'System Design', icon: Zap },
        { id: 3, name: 'Pricing', icon: DollarSign },
        { id: 4, name: 'Proposal', icon: FileText },
    ];

    // Navigation
    const nextStep = () => {
        if (step === 1 && !client) {
            toast.error("Please select a client to proceed.");
            return;
        }
        setStep(s => Math.min(s + 1, 4));
    };
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    // Calculations - CRASH PROOF
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum, item) => {
        // Handle price strings if they come from inventory with '₦'
        let priceNum = item.price;
        if (typeof item.price === 'string') {
            priceNum = parseFloat(item.price.replace(/[^0-9.]/g, ''));
        }
        const p = Number(priceNum) || 0;
        const q = Number(item.qty) || 0;
        return sum + (p * q);
    }, 0) + (Number(laborCost) || 0);

    const discountAmount = (subtotal * (Number(discount) || 0)) / 100;
    const vat = (subtotal - discountAmount) * 0.075; // 7.5% VAT
    const grandTotal = subtotal - discountAmount + vat;

    // Handlers
    const updateItemQty = (index, newQty) => {
        if (!items) return;
        const newItems = [...items];
        if (newItems[index]) {
            newItems[index].qty = Math.max(1, Number(newQty) || 1);
            setItems(newItems);
        }
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const getGrandTotal = () => {
        const subtotal = safeItems.reduce((sum, item) => sum + (item.price * item.qty), 0) + Number(laborCost);
        const discountAmount = (subtotal * Number(discount)) / 100;
        const vat = (subtotal - discountAmount) * 0.075;
        return subtotal - discountAmount + vat;
    };

    const addItem = (item) => {
        setItems([...items, { ...item, id: Date.now() }]); // Add timestamp ID to avoid key conflicts
    };

    const handleFinish = async () => {
        if (!client) {
            toast.error("Please select a client.");
            return;
        }

        setIsGenerating(true);
        try {
            const total = getGrandTotal();

            // 1. Create Quote Document
            const quoteData = {
                clientId: client.id,
                clientName: client.name,
                clientEmail: client.email || '',
                clientPhone: client.phone || '',
                clientAddress: client.address || '',
                items: items,
                laborCost: Number(laborCost),
                discount: Number(discount),
                totalValue: total,
                status: 'Draft', // Initial status
                systemConfig,
                generatedBy: 'Sales Rep' // TODO: user currentUser.displayName
            };

            const newQuote = await createQuote(quoteData);

            // 2. Convert to Project (Auto-Creation Logic)
            const projectData = {
                name: `${client.name} - Solar Install`,
                client: client.name,
                clientId: client.id,
                clientInfo: {
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    address: client.address
                },
                status: 'Active',
                phase: 'Planning',
                progress: 0,
                health: 'good',
                budget: total, // Set budget to quote total
                spent: 0,
                startDate: new Date().toISOString().split('T')[0],
                // Estimate due date (e.g., 30 days out)
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: `Project auto-generated from Quote #${newQuote.id}. System Size: ${systemConfig.dailyLoad}Wh / ${systemConfig.backupHours}h Backup`,
                quoteId: newQuote.id,
                team: []
            };

            await createProject(projectData);

            toast.success("Quote saved & Project initialized!");
            navigate('/sales'); // Redirect back to dashboard

        } catch (error) {
            console.error("Error saving quote:", error);
            toast.error("Failed to save quote.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-premium-gold-500 rounded-full animate-spin"></div>
                <p>Loading project details...</p>
            </div>
        );
    }

    return (
        <div className="quote-page">
            <div className="quote-page-container">
                {/* 2. HEADER - Company Branding */}
                <div className="quote-header">
                    <div className="company-info">
                        <h1>SOLAR INSTALLATION QUOTATION</h1>
                        <p className="quote-number">Quote #Q-2026-{Math.floor(Math.random() * 1000).toString().padStart(4, '0')}</p>
                        <p className="quote-date">Valid until: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} (30 days)</p>
                    </div>
                    <div className="company-logo flex items-center gap-3">
                        <img src={primistineLogo} alt="Primistine Electric" className="w-12 h-12 rounded-lg" />
                        <div>
                            <div className="font-bold text-xl text-premium-blue-900 tracking-tight">PRIMISTINE</div>
                            <div className="text-xs text-premium-gold-500 font-semibold tracking-widest">ELECTRIC LIMITED</div>
                        </div>
                    </div>
                </div>

                {/* 8. PROGRESS STEPS - Cleaner Design */}
                <div className="progress-steps">
                    {STEPS.map((s) => (
                        <div key={s.id} className={clsx("step", step === s.id && "active", step > s.id && "completed")}>
                            <div className={clsx("step-circle", step === s.id && "active", step > s.id && "completed")}>
                                {step > s.id ? <Check size={20} /> : <s.icon size={20} />}
                            </div>
                            <span className="step-label">{s.name}</span>
                        </div>
                    ))}
                </div>

                {/* 1. CONTAINER content */}
                <div className="quote-content">
                    {/* STEP 1: CLIENT SELECTION */}
                    {step === 1 && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="section-title">Client Information</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Search Client</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Start typing client name..."
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="mt-4 text-xs text-slate-500">
                                        Can't find client? <button onClick={() => navigate('/clients')} className="text-blue-600 underline">Add them to directory</button> first.
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        {clientSearch ? 'Search Results' : 'Recent Clients'}
                                    </label>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredClients.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500 border border-dashed rounded-lg">
                                                No clients found matching "{clientSearch}"
                                            </div>
                                        ) : (
                                            filteredClients.map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => setClient(c)}
                                                    className={clsx(
                                                        "p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center group",
                                                        client?.id === c.id ? "border-[#1e40af] bg-blue-50" : "border-slate-200 hover:border-blue-300"
                                                    )}
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-800">{c.name}</div>
                                                        <div className="text-sm text-slate-500">{c.address || c.email}</div>
                                                    </div>
                                                    {client?.id === c.id && <Check className="text-[#1e40af]" size={20} />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SYSTEM DESIGN */}
                    {step === 2 && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="section-title">System Configuration</h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="section">
                                        <label className="block text-sm font-semibold text-slate-700 mb-3">Target Daily Load</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" readOnly value={systemConfig.dailyLoad} className="flex-1 p-3 border border-slate-300 rounded-lg font-mono text-lg bg-slate-50 text-slate-600" />
                                            <span className="font-bold text-slate-500">Wh</span>
                                        </div>
                                    </div>
                                    <div className="section">
                                        <label className="block text-sm font-semibold text-slate-700 mb-3">Backup Autonomy</label>
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="2" max="24" value={systemConfig.backupHours} onChange={e => setSystemConfig({ ...systemConfig, backupHours: e.target.value })}
                                                className="flex-1 accent-[#1e40af] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="font-bold text-[#1e40af] w-16 text-right">{systemConfig.backupHours} hrs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Recommended Specs</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Inverter Size</span>
                                            <span className="font-bold text-slate-900 text-lg">5 kVA</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Solar Array</span>
                                            <span className="font-bold text-slate-900 text-lg">3.6 kWp</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Battery Bank</span>
                                            <span className="font-bold text-slate-900 text-lg">9.6 kWh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PRICING (5. LAYOUT - Two Column Design) */}
                    {step === 3 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="pricing-layout">
                                {/* Left side - Materials table (70%) */}
                                <div className="materials-section">
                                    <h2>Equipment & Materials</h2>
                                    {/* 3. MATERIALS TABLE - Professional Styling */}
                                    <div className="overflow-x-auto">
                                        <table className="materials-table min-w-[600px]"> {/* Min-width ensures it doesn't crush content */}
                                            <thead>
                                                <tr>
                                                    <th className="w-12">#</th>
                                                    <th>Item Description</th>
                                                    <th className="w-24">Qty</th>
                                                    <th className="w-32">Unit Price</th>
                                                    <th className="w-32">Total</th>
                                                    <th className="w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="text-center text-slate-400">{idx + 1}</td>
                                                        <td>
                                                            <div className="font-medium text-slate-900">{item.name}</div>
                                                            <div className="text-xs text-slate-500 uppercase">{item.category}</div>
                                                        </td>
                                                        <td className="text-center">
                                                            <input type="number" min="1" value={item.qty}
                                                                onChange={(e) => updateItemQty(idx, e.target.value)}
                                                                className="w-16 p-1 text-center border border-slate-200 rounded bg-slate-50"
                                                            />
                                                        </td>
                                                        <td className="currency whitespace-nowrap">₦{item.price.toLocaleString()}</td>
                                                        <td className="currency whitespace-nowrap">₦{(item.price * item.qty).toLocaleString()}</td>
                                                        <td>
                                                            <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 delete-btn">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button onClick={() => setIsAddItemModalOpen(true)} className="add-item-btn">+ Add Item</button>

                                    <AddQuoteItemModal
                                        isOpen={isAddItemModalOpen}
                                        onClose={() => setIsAddItemModalOpen(false)}
                                        onAddItem={addItem}
                                    />
                                </div>

                                {/* Right side - Cost summary (30%) */}
                                <div className="summary-section">
                                    {/* 4. COST SUMMARY - Card Style */}
                                    <div className="cost-summary">
                                        <h3>Financial Summary</h3>
                                        <div className="cost-row">
                                            <span className="cost-label">Subtotal</span>
                                            <span className="amount currency">₦{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-row">
                                            <span className="cost-label">Logistics & Installation</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-400 text-xs">₦</span>
                                                <input
                                                    type="number"
                                                    value={laborCost}
                                                    onChange={(e) => setLaborCost(Number(e.target.value))}
                                                    className="w-24 p-1 text-right border border-slate-200 rounded bg-slate-50 text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="cost-row">
                                            <span className="cost-label">VAT (7.5%)</span>
                                            <span className="amount currency">₦{vat.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-row total">
                                            <span className="cost-label">Total</span>
                                            <span className="amount currency">₦{grandTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: PROPOSAL PREVIEW */}
                    {step === 4 && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="section-title">Final Review</h2>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-4">
                                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Proposal Ready for Export</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    The quotation for <strong>{client?.name || 'Client'}</strong> amounting to <strong>₦{grandTotal.toLocaleString()}</strong> is ready to be sent.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="action-buttons">
                    <button onClick={prevStep} disabled={step === 1} className="back-btn">
                        Back
                    </button>
                    {step < 4 ? (
                        <button onClick={nextStep} className="next-step-btn">
                            Next Step <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button onClick={handleFinish} disabled={isGenerating} className="next-step-btn">
                            {isGenerating ? 'Processing...' : 'Generate & Send'} <Mail size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
