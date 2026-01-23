import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { auditService } from '../lib/services/auditService';
import { SystemLogger, LOG_ACTIONS } from '../lib/services/SystemLogger';
import { useAuth } from '../contexts/AuthContext';
import { AUDIT_VALIDATION_RULES } from '../lib/auditRules';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const STEPS = {
    0: { title: 'Service Selection', id: 'service' },
    1: { title: 'Client & Site Questionnaire', id: 'details' },
    2: { title: 'Final Review', id: 'review' },
    3: { title: 'Submission Successful', id: 'success' },
};

export function useAuditWizard() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const isEditMode = !!id && id !== 'new';

    // State
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedServices, setSelectedServices] = useState([]);
    const [auditData, setAuditData] = useState({});
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
    const [isFromLead, setIsFromLead] = useState(false);
    const [localToast, setLocalToast] = useState(null);

    const viewportRef = useRef(null);

    const showToast = (message, type = 'error') => {
        setLocalToast({ message, type });
        if (type === 'error') toast.error(message);
        if (type === 'success') toast.success(message);
    };

    // Persistence Key
    const STORAGE_KEY = isEditMode ? `audit_draft_${id}` : 'audit_draft_new';

    // 1. Offline Detection
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

    // 2. Load Data (Edit Mode or Pre-fill)
    useEffect(() => {
        const init = async () => {
            // Pre-fill from Lead
            if (!isEditMode && location.state?.leadData) {
                const lead = location.state.leadData;

                // Check for existing audit
                try {
                    const existingAudit = await auditService.getAuditByLeadId(lead.id);
                    if (existingAudit) {
                        toast.success("Opening existing audit for this lead");
                        navigate(`/audits/${existingAudit.id}`);
                        return;
                    }
                } catch (e) {
                    console.error("Error checking existing audit", e);
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

                // Map services
                if (location.state.preSelectedService) {
                    setSelectedServices([location.state.preSelectedService]);
                    setCurrentStep(1);
                } else if (lead.serviceInterest?.length > 0) {
                    const serviceMap = {
                        'Solar & Inverter': 'solar',
                        'CCTV & Security': 'cctv',
                        'Electrical Wiring': 'wiring',
                        'Earthing & Surge': 'earthing',
                        'Generator / ATS': 'generator',
                        'Industrial Safety': 'industrial'
                    };
                    const mappedServices = lead.serviceInterest.map(name => serviceMap[name]).filter(Boolean);
                    if (mappedServices.length > 0) {
                        setSelectedServices(mappedServices);
                        setCurrentStep(1);
                    }
                }
            }

            // Load for Edit Mode
            if (isEditMode) {
                try {
                    const data = await auditService.getAuditById(id);
                    if (data) {
                        setAuditData({
                            client: { clientName: data.clientName, ...data.client },
                            site: data.site,
                            load: data.load,
                            infra: data.infra,
                            design: data.design,
                            ...data
                        });
                        setSelectedServices(data.services || data.serviceTypes || []);
                        if ((data.services?.length > 0 || data.serviceTypes?.length > 0) && currentStep === 0) {
                            setCurrentStep(1);
                        }
                    } else {
                        toast.error("Audit not found");
                        navigate('/audits');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to load audit");
                } finally {
                    setIsLoading(false);
                }
            }

            // Restore Draft (only if not pre-filled/edit loaded successfully yet?)
            // Keeping logic simple: Check storage if not explicitly blocked
            if (!isEditMode && !location.state?.leadData) {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        const session = JSON.parse(saved);
                        if ((Date.now() - session.timestamp) < 24 * 60 * 60 * 1000) {
                            if (session.data) setAuditData(session.data);
                            if (session.step !== undefined) setCurrentStep(session.step);
                            if (session.services) setSelectedServices(session.services);
                            if (session.isFromLead) setIsFromLead(true);
                            toast.success("Restored previous session");
                        }
                    } catch (e) { console.error(e); }
                }
            }
        };

        init();
    }, [isEditMode, id, location.state, navigate]);

    // 3. Auto-Save
    useEffect(() => {
        if (isLoading) return;
        if (Object.keys(auditData).length === 0 && selectedServices.length === 0) return;

        const timer = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                data: auditData,
                step: currentStep,
                services: selectedServices,
                isFromLead,
                timestamp: Date.now()
            }));
            setLastSaved(new Date());
        }, 1000);

        return () => clearTimeout(timer);
    }, [auditData, currentStep, selectedServices, isFromLead, isLoading, STORAGE_KEY]);


    // Validation
    const validateStep = (step) => {
        const validator = AUDIT_VALIDATION_RULES[step];
        if (validator) return validator(auditData, selectedServices);
        return true;
    };

    // Actions
    const updateData = (section, data) => {
        setAuditData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
    };

    const handleNext = async () => {
        const validationResult = validateStep(currentStep);
        if (validationResult !== true) {
            showToast(validationResult, 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (currentStep === 2) {
            await handleSubmitAudit();
        } else {
            setCurrentStep(c => c + 1);
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
        else navigate('/audits');
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleSubmitAudit = async () => {
        setIsSaving(true);
        const auditId = isEditMode ? id : `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const finalAudit = {
            id: auditId,
            ...auditData,
            services: selectedServices,
            status: 'Completed',
            submittedAt: auditData.submittedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            engineer: currentUser?.displayName || currentUser?.email || 'System'
        };

        try {
            await auditService.saveAudit(finalAudit);
            await SystemLogger.log(
                isEditMode ? LOG_ACTIONS.AUDIT_UPDATED : LOG_ACTIONS.AUDIT_SUBMITTED,
                `${isEditMode ? 'Updated' : 'Submitted'} audit for ${finalAudit.client.clientName}`,
                { auditId, clientName: finalAudit.client.clientName }
            );

            if (isFromLead && auditData.client?.leadId) {
                const leadRef = doc(db, 'leads', auditData.client.leadId);
                await updateDoc(leadRef, { stage: 'audit', updatedAt: serverTimestamp() });
                toast.success("Lead moved to Audited stage 🚀");
            }

            toast.success(`Audit ${isEditMode ? 'Updated' : 'Submitted'} Successfully!`);
            setAuditData(prev => ({ ...prev, id: auditId }));
            setCurrentStep(3);
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error(error);
            showToast("Failed to save audit.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateQuote = async () => {
        setIsGeneratingQuote(true);
        try {
            const results = auditData.design || {};
            const equipment = [
                { item: `${results.recommendedInverter || 0}kVA Hybrid Inverter`, quantity: 1, unitPrice: (results.recommendedInverter || 0) * 120000, category: 'Inverter' },
                { item: `${results.batteryCapacity || 0}kWh System Battery`, quantity: 1, unitPrice: (results.batteryCapacity || 0) * 95000, category: 'Battery' },
                { item: `${results.solarArraySize || 0}kWp Solar Array`, quantity: 1, unitPrice: (results.solarArraySize || 0) * 160000, category: 'Solar Panels' }
            ];

            const quoteData = {
                clientId: auditData.client?.id || 'unknown',
                clientName: auditData.client?.clientName || 'Unknown',
                auditId: auditData.id,
                serviceType: selectedServices.includes('solar') ? 'Solar Installation' : 'System Upgrade',
                specs: { inverter: results.recommendedInverter || 0, battery: results.batteryCapacity || 0, solar: results.solarArraySize || 0 },
                equipment,
                totalAmount: results.totalSystemCostEstimate || 0,
                status: 'Draft',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'quotes'), quoteData);
            toast.success('Quote generated!');
            navigate(`/sales/quotes/${docRef.id}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate quote.');
        } finally {
            setIsGeneratingQuote(false);
        }
    };

    return {
        // State
        currentStep,
        selectedServices,
        auditData,
        isOffline,
        isSaving,
        lastSaved,
        isLoading,
        isGeneratingQuote,
        isFromLead,
        isEditMode,
        id, // audit ID
        localToast,
        STEPS,

        // Setters
        setCurrentStep,
        setSelectedServices,
        setLocalToast,

        // Actions
        updateData,
        handleNext,
        handleBack,
        handleGenerateQuote,
        handleSubmitAudit
    };
}
