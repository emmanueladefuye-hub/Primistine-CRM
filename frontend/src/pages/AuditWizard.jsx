import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle, Camera, Locate, ClipboardCheck, MessageSquarePlus } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import ServiceSelector from '../components/audits/ServiceSelector';
import ClientProjectInfo from '../components/audits/universal/ClientProjectInfo';
import SiteAssessment from '../components/audits/universal/SiteAssessment';
import LoadInventory from '../components/audits/sections/LoadInventory';
import PowerInfrastructure from '../components/audits/sections/PowerInfrastructure';
import SystemDesign from '../components/audits/sections/SystemDesign';
import FinalReview from '../components/audits/FinalReview';
import Toast from '../components/ui/Toast';
import { toast } from 'react-hot-toast';
import { auditService } from '../lib/services/auditService';
import SiteAuditFAB from '../components/audits/tools/SiteAuditFAB';
import { SystemLogger, LOG_ACTIONS } from '../lib/services/SystemLogger';
import { useAuth } from '../contexts/AuthContext';

import { AUDIT_VALIDATION_RULES } from '../lib/auditRules';

const STEPS = {
    0: { title: 'Service Selection', id: 'service' },
    1: { title: 'Client & Site Questionnaire', id: 'details' },
    2: { title: 'Final Review', id: 'review' },
    3: { title: 'Submission Successful', id: 'success' },
};

export default function AuditWizard() {
    const navigate = useNavigate();
    const location = useLocation(); // ADDED
    const { id } = useParams();
    const { currentUser } = useAuth();
    const isEditMode = !!id && id !== 'new';

    const [currentStep, setCurrentStep] = useState(0);
    const [selectedServices, setSelectedServices] = useState([]);

    const [auditData, setAuditData] = useState({});
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [localToast, setLocalToast] = useState(null);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

    const [isFromLead, setIsFromLead] = useState(false);

    const showToast = (message, type = 'error') => {
        setLocalToast({ message, type });
    };

    // Handle Pre-fill from Lead
    useEffect(() => {
        if (!isEditMode && location.state?.leadData) {
            const lead = location.state.leadData;


            const checkAndPrefill = async () => {
                try {
                    // Check if audit already exists for this lead
                    const existingAudit = await auditService.getAuditByLeadId(lead.id);
                    if (existingAudit) {
                        showToast("Opening existing audit for this lead", "success");
                        navigate(`/audits/${existingAudit.id}`);
                        return;
                    }

                    setIsFromLead(true);

                    setAuditData(prev => ({
                        ...prev,
                        client: {
                            clientName: (lead.company && lead.company !== 'Private Client') ? lead.company : lead.name,
                            contactPerson: lead.name,
                            phone: lead.phone,
                            email: lead.email,
                            address: lead.address,
                            leadId: lead.id
                        },
                        site: {
                            address: lead.address,
                            type: lead.type || 'Residential'
                        }
                    }));

                    // Determine services to select
                    let servicesKey = [];
                    if (location.state.preSelectedService) {
                        servicesKey = [location.state.preSelectedService];
                    } else if (lead.serviceInterest && lead.serviceInterest.length > 0) {
                        const serviceMap = {
                            'Solar & Inverter': 'solar',
                            'CCTV & Security': 'cctv',
                            'Electrical Wiring': 'wiring',
                            'Earthing & Surge': 'earthing',
                            'Generator / ATS': 'generator',
                            'Industrial Safety': 'industrial'
                        };
                        servicesKey = lead.serviceInterest
                            .map(name => serviceMap[name])
                            .filter(id => id);
                    }

                    if (servicesKey.length > 0) {

                        setSelectedServices(servicesKey);
                        setCurrentStep(1); // Jump to form
                    }
                } catch (error) {
                    console.error("Error in checkAndPrefill:", error);
                    showToast("Error loading lead data", "error");
                }
            };

            checkAndPrefill();
        }
    }, [isEditMode, location.state]);

    // Load Data for Editing
    useEffect(() => {
        if (isEditMode) {
            // ... existing load logic
            const loadAudit = async () => {
                try {
                    const data = await auditService.getAuditById(id);
                    if (data) {
                        setAuditData({
                            client: {
                                clientName: data.clientName, // Legacy mapping if strictly flat
                                ...data.client
                            },
                            site: data.site,
                            load: data.load,
                            infra: data.infra,
                            design: data.design,
                            ...data // Merge all other fields
                        });
                        setSelectedServices(data.services || data.serviceTypes || []);

                        // If editing, auto-advance to Client Info step so they see their data immediately
                        if (data.services?.length > 0 || data.serviceTypes?.length > 0) {
                            setCurrentStep(1);
                        }
                    } else {
                        showToast("Audit not found", "error");
                        navigate('/audits');
                    }
                } catch (error) {
                    console.error(error);
                    showToast("Failed to load audit details", "error");
                } finally {
                    setIsLoading(false);
                }
            };
            loadAudit();
        }
    }, [id, isEditMode, navigate]);

    // Offline detection
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Persistence Logic
    const STORAGE_KEY = isEditMode ? `audit_draft_${id}` : 'audit_draft_new';

    // 1. Auto-Restore on Mount
    useEffect(() => {
        const checkRestore = async () => {
            if (isLoading && isEditMode) return; // Wait for core load if editing? 

            // CONFLICT FIX: If user is coming from "Schedule Audit" (Lead Detail),
            // do NOT restore old drafts. We want a fresh start for this specific lead.
            if (location.state?.leadData) {

                return;
            }
            // Actually for edit mode, we typically want to overlay local changes ON TOP of server data
            // But if we just want "persistence", checking local first is cleaner.

            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const session = JSON.parse(saved);
                    // Check expiry? (e.g. 24h)
                    const isRecent = (Date.now() - session.timestamp) < 24 * 60 * 60 * 1000;

                    if (isRecent) {
                        // Restore
                        if (session.data) setAuditData(session.data);
                        if (session.step !== undefined) setCurrentStep(session.step);
                        if (session.services) setSelectedServices(session.services);

                        // If it was a new audit from lead, preserve that flag
                        if (session.isFromLead) setIsFromLead(true);

                        showToast("Restored your previous session", "success");

                    }
                }
            } catch (err) {
                console.error("Failed to restore session", err);
            }
        };

        // If it's a new audit, run immediately. 
        // If it's edit, we might want to run this AFTER the server fetch to override it?
        // Or run it independently. Let's run it.
        checkRestore();
    }, [STORAGE_KEY]); // Run once per key

    // 2. Auto-Save
    useEffect(() => {
        // Don't save if empty or loading
        if (isLoading) return;
        if (Object.keys(auditData).length === 0 && selectedServices.length === 0) return;

        const timer = setTimeout(() => {
            try {
                const session = {
                    data: auditData,
                    step: currentStep,
                    services: selectedServices,
                    isFromLead: isFromLead,
                    timestamp: Date.now()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
                setLastSaved(new Date());
            } catch (err) {
                console.error("Failed to save session", err);
            }
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [auditData, currentStep, selectedServices, isFromLead, isLoading, STORAGE_KEY]);

    const validateStep = (step) => {
        const rule = AUDIT_VALIDATION_RULES[step];
        if (rule) {
            return rule(auditData, selectedServices);
        }
        return true;
    };

    const handleNext = () => {
        const isValid = validateStep(currentStep);
        if (isValid === true) {
            // Check if it's the final submit (Now Step 2)
            if (currentStep === 2) {
                handleSubmitAudit();
            } else {
                if (currentStep < 3) setCurrentStep(c => c + 1);
            }
        } else {
            showToast(isValid, 'error');
            // Optional: Scroll to top of error?
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Import service (Will be added at top, but here's the logic function)
    const handleSubmitAudit = async () => {
        setIsSaving(true);

        // If Edit Mode, use existing ID. Else generate new.
        const auditId = isEditMode ? id : `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const finalAudit = {
            id: auditId,
            ...auditData,
            services: selectedServices,
            status: 'Completed',
            // Preserve original submittedAt if editing, or set new if new
            submittedAt: auditData.submittedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            engineer: currentUser?.displayName || currentUser?.email || 'System'
        };

        try {
            await auditService.saveAudit(finalAudit);

            await SystemLogger.log(
                isEditMode ? LOG_ACTIONS.AUDIT_UPDATED : LOG_ACTIONS.AUDIT_SUBMITTED,
                `${isEditMode ? 'Updated' : 'Submitted'} audit for ${finalAudit.client.clientName}`,
                {
                    auditId: finalAudit.id,
                    clientName: finalAudit.client.clientName,
                    services: finalAudit.services,
                    engineer: finalAudit.engineer,
                    userId: currentUser?.uid
                }
            );

            // NEW: Auto-advance lead stage to 'audit' (Audited)
            if (isFromLead && auditData.client?.leadId) {
                const leadRef = doc(db, 'leads', auditData.client.leadId);
                await updateDoc(leadRef, {
                    hasAudit: true,
                    auditStatus: 'Completed', // Added status for workflow enforcement
                    stage: 'audit',
                    updatedAt: serverTimestamp()
                });

                await SystemLogger.log(LOG_ACTIONS.LEAD_UPDATED, `Auto-moved lead to Audited stage`, {
                    leadId: auditData.client.leadId,
                    newStage: 'audit'
                });

                toast.success("Lead moved to Audited stage", {
                    icon: '🚀',
                    style: {
                        borderRadius: '10px',
                        background: '#1e1b4b',
                        color: '#fff',
                    },
                });
            }

            showToast(`Audit ${auditId} ${isEditMode ? 'Updated' : 'Submitted'} Successfully!`, 'success');
            setAuditData(prev => ({ ...prev, id: auditId })); // Ensure ID is in state for success screen
            setCurrentStep(3); // Advance to logical success screen

            // Clear local draft on success
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error(error);
            showToast("Failed to save audit to cloud. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateQuote = async () => {
        setIsGeneratingQuote(true);
        try {
            // Map current audit results to quote structure
            // This mirrors the logic in AuditDetail.jsx but uses auditData state
            const results = auditData.design || {};
            const loadStats = auditData.load?.stats || {};

            const equipment = [
                {
                    item: `${results.recommendedInverter || 0}kVA Hybrid Inverter`,
                    quantity: 1,
                    unitPrice: (results.recommendedInverter || 0) * 120000,
                    category: 'Inverter'
                },
                {
                    item: `${results.batteryCapacity || 0}kWh System Battery`,
                    quantity: 1,
                    unitPrice: (results.batteryCapacity || 0) * 95000,
                    category: 'Battery'
                },
                {
                    item: `${results.solarArraySize || 0}kWp Solar Array`,
                    quantity: 1,
                    unitPrice: (results.solarArraySize || 0) * 160000,
                    category: 'Solar Panels'
                }
            ];

            const quoteData = {
                clientId: auditData.client?.id || 'unknown',
                clientName: auditData.client?.clientName || 'Unknown',
                auditId: auditData.id,
                serviceType: selectedServices.includes('solar') ? 'Solar Installation' : 'System Upgrade',
                specs: {
                    inverter: results.recommendedInverter || 0,
                    battery: results.batteryCapacity || 0,
                    solar: results.solarArraySize || 0
                },
                equipment,
                totalAmount: results.totalSystemCostEstimate || (results.recommendedInverter * 250000) || 0,
                status: 'Draft',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'quotes'), quoteData);
            showToast('Quote generated and linked!', 'success');
            navigate(`/sales/quotes/${docRef.id}`);
        } catch (error) {
            console.error(error);
            showToast('Failed to generate quote.', 'error');
        } finally {
            setIsGeneratingQuote(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
        else navigate('/audits');
    };

    const updateData = (section, data) => {
        setAuditData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
        setLastSaved(new Date());
    };

    const viewportRef = React.useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Scroll to top when step changes
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [currentStep]);

    const handleScroll = () => {
        if (!viewportRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
        const winScroll = scrollTop;
        const height = scrollHeight - clientHeight;
        const scrolled = height > 0 ? winScroll / height : 0;
        setScrollProgress(scrolled);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="animate-spin w-8 h-8 mb-2" />
                <span className="block ml-2">Loading audit...</span>
            </div>
        );
    }

    // Render Step Content
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ServiceSelector
                        selected={selectedServices}
                        onSelect={(newServices) => {
                            setSelectedServices(newServices);
                            // Auto-advance logic for Single Click
                            if (newServices.length > 0) {
                                setCurrentStep(1);
                            }
                        }}
                        onNext={handleNext}
                        showToast={showToast}
                    />
                );
            case 1:
                return (
                    <div className="space-y-12">
                        {/* Section 1: Client Info */}
                        <section id="client-info">
                            <ClientProjectInfo
                                data={auditData.client || {}}
                                updateData={(d) => updateData('client', d)}
                                onNext={() => { }} // No-op for internal next
                                services={selectedServices}
                                showToast={showToast}
                                hideNavigation={true}
                            />
                        </section>

                        <div className="border-t border-slate-200" />

                        {/* Section 2: Site Assessment */}
                        <section id="site-assessment">
                            <SiteAssessment
                                data={auditData.site || {}}
                                updateData={(d) => updateData('site', d)}
                                onNext={() => { }}
                                services={selectedServices}
                                showToast={showToast}
                            />
                        </section>

                        <div className="border-t border-slate-200" />

                        {/* Section 3: Load Inventory */}
                        <section id="load-inventory">
                            <LoadInventory
                                data={auditData.load || {}}
                                updateData={(d) => updateData('load', d)}
                                onNext={() => { }}
                                services={selectedServices}
                                showToast={showToast}
                            />
                        </section>

                        <div className="border-t border-slate-200" />

                        {/* Section 4: Power Infrastructure */}
                        <section id="power-infra">
                            <PowerInfrastructure
                                data={auditData.infra || {}}
                                updateData={(d) => updateData('infra', d)}
                                onNext={() => { }}
                                services={selectedServices}
                                showToast={showToast}
                            />
                        </section>

                        <div className="border-t border-slate-200" />

                        {/* Section 5: System Design */}
                        <section id="system-design">
                            <SystemDesign
                                data={auditData.design || {}}
                                loadData={auditData.load || {}}
                                siteData={auditData.site || {}}
                                updateData={(d) => updateData('design', d)}
                                onNext={() => { }}
                                services={selectedServices}
                                showToast={showToast}
                            />
                        </section>
                    </div>
                );
            case 2:
                // Final Review
                return (
                    <FinalReview
                        data={auditData}
                        onNext={handleNext}
                        setStep={setCurrentStep}
                        services={selectedServices}
                        showToast={showToast}
                    />
                );
            case 3:
                // Logical Success Screen
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-premium-blue-900 mb-2">Audit Submitted!</h2>
                        <p className="text-slate-500 mb-10 max-w-sm">
                            Technical survey for <b>{auditData.client?.clientName}</b> has been securely synced to the cloud.
                        </p>

                        <div className="flex justify-center w-full max-w-md px-6">
                            <button
                                onClick={() => navigate(`/audits/${auditData.id}`)}
                                className="flex items-center justify-center gap-2 p-4 bg-premium-blue-900 text-white rounded-2xl font-bold shadow-lg hover:bg-premium-blue-800 transition-all w-full"
                            >
                                <ClipboardCheck size={20} /> View Full Report
                            </button>
                        </div>

                        <Link to="/audits" className="mt-8 text-sm font-medium text-slate-400 hover:text-slate-600">
                            Back to Audit Dashboard
                        </Link>
                    </div>
                );
            default:
                return null;
        }
    };

    let displayProgress = 0;
    if (currentStep === 0) {
        displayProgress = 5; // Initial tiny bar
    } else if (currentStep === 1) {
        // Range 10% to 90%
        displayProgress = 10 + (scrollProgress * 80);
    } else if (currentStep === 2) {
        displayProgress = 100;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 h-auto py-3 min-h-[72px] flex items-center sticky top-0 z-40 transition-all">
                <div className="flex items-center justify-between w-full h-full max-w-7xl mx-auto px-4 gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <button onClick={handleBack} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-xl font-black text-premium-blue-900 leading-tight tracking-tight truncate">
                                {isEditMode ? `Edit Audit #${id}` : 'New Site Audit'}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase">Step {currentStep + 1}/3</span>
                                <span className="text-[10px] font-bold text-premium-gold-600 uppercase tracking-widest truncate">{STEPS[currentStep]?.title}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {isOffline && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black border border-amber-200 animate-pulse uppercase">
                                <AlertTriangle size={12} />
                                <span className="hidden sm:inline">Offline</span>
                            </div>
                        )}

                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {isSaving ? (
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl"><Loader2 size={12} className="animate-spin text-premium-blue-500" /> Saving...</span>
                            ) : lastSaved ? (
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl"><CheckCircle2 size={12} className="text-emerald-500" /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ) : null}
                        </div>

                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-600 uppercase tracking-wider hover:bg-slate-100 hover:text-premium-blue-900 rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95">
                            <Save size={16} />
                            Draft
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/50">
                    <div
                        className="h-full bg-gradient-to-r from-premium-gold-400 to-premium-gold-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                        style={{ width: `${displayProgress}%` }}
                    />
                </div>
            </div>

            <Toast
                message={localToast?.message}
                type={localToast?.type}
                onClose={() => setLocalToast(null)}
            />

            {/* Main Content Area */}
            <div
                ref={viewportRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto"
            >
                <div className="max-w-4xl mx-auto py-10 px-6 pb-32">

                    {/* Pre-fill Banner */}
                    {isFromLead && currentStep < 3 && (
                        <div className="mb-6 bg-premium-blue-50 border border-premium-blue-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <div className="bg-premium-blue-100 p-2 rounded-lg text-premium-blue-600">
                                <ClipboardCheck size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-premium-blue-900 text-sm">Audit Pre-populated from Lead</h3>
                                <p className="text-xs text-premium-blue-700">
                                    Client details and service interest have been imported from <span className="font-bold">{auditData.client?.clientName}</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Action Bar (Floating & Glassmorphic) - Hidden on Step 0 and Step 3 (Success) */}
            {currentStep > 0 && currentStep < 3 && (
                <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-8">
                    <div className="w-full max-w-lg bg-white border border-slate-200 shadow-xl shadow-slate-900/10 rounded-2xl p-2 flex gap-3 pointer-events-auto items-center mx-4">
                        <button
                            onClick={handleBack}
                            className="py-3 px-6 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isSaving}
                            className={clsx(
                                "flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                                isSaving
                                    ? "bg-slate-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-premium-blue-900 to-premium-blue-800 hover:shadow-premium-blue-900/25 hover:-translate-y-0.5 active:scale-[0.98]"
                            )}
                        >
                            {currentStep === 2 ? (
                                isSaving ? (
                                    <>Saving <Loader2 size={18} className="animate-spin" /></>
                                ) : (
                                    <>Submit Audit <CheckCircle2 size={18} /></>
                                )
                            ) : (
                                <>Continue <ArrowLeft size={18} className="rotate-180" /></>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Quick Tools (FAB) */}
            <SiteAuditFAB currentStep={currentStep} data={auditData} updateData={updateData} showToast={showToast} />
        </div>
    );
}
