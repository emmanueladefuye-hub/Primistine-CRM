import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// Components
import ServiceSelector from '../components/audits/ServiceSelector';
import ClientProjectInfo from '../components/audits/universal/ClientProjectInfo';
import SiteAssessment from '../components/audits/universal/SiteAssessment';
import LoadInventory from '../components/audits/sections/LoadInventory';
import PowerInfrastructure from '../components/audits/sections/PowerInfrastructure';
import SystemDesign from '../components/audits/sections/SystemDesign';
import FinalReview from '../components/audits/FinalReview';
import Toast from '../components/ui/Toast';
import SiteAuditFAB from '../components/audits/tools/SiteAuditFAB';

// Hook
import { useAuditWizard, STEPS } from '../hooks/useAuditWizard';

export default function AuditWizard_v2() {
    const {
        currentStep,
        selectedServices,
        auditData,
        isOffline,
        isSaving,
        lastSaved,
        isLoading,
        isFromLead,
        isEditMode,
        id,
        localToast,
        setLocalToast,
        setSelectedServices,
        setCurrentStep,
        updateData,
        handleNext,
        handleBack
    } = useAuditWizard();

    // Progress Calculation
    let displayProgress = 0;
    if (currentStep === 0) displayProgress = 5;
    else if (currentStep === 1) displayProgress = 50; // Simplified for v2
    else if (currentStep === 2) displayProgress = 100;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="animate-spin w-8 h-8 mb-2" />
                <span className="block ml-2">Loading audit...</span>
            </div>
        );
    }

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ServiceSelector
                        selected={selectedServices}
                        onSelect={(newServices) => {
                            setSelectedServices(newServices);
                            if (newServices.length > 0) setCurrentStep(1);
                        }}
                        onNext={handleNext}
                    />
                );
            case 1:
                return (
                    <div className="space-y-12">
                        <section><ClientProjectInfo data={auditData.client || {}} updateData={(d) => updateData('client', d)} services={selectedServices} hideNavigation={true} /></section>
                        <div className="border-t border-slate-200" />
                        <section><SiteAssessment data={auditData.site || {}} updateData={(d) => updateData('site', d)} services={selectedServices} /></section>
                        <div className="border-t border-slate-200" />
                        <section><LoadInventory data={auditData.load || {}} updateData={(d) => updateData('load', d)} services={selectedServices} /></section>
                        <div className="border-t border-slate-200" />
                        <section><PowerInfrastructure data={auditData.infra || {}} updateData={(d) => updateData('infra', d)} services={selectedServices} /></section>
                        <div className="border-t border-slate-200" />
                        <section><SystemDesign data={auditData.design || {}} loadData={auditData.load || {}} siteData={auditData.site || {}} updateData={(d) => updateData('design', d)} services={selectedServices} /></section>
                    </div>
                );
            case 2:
                return <FinalReview data={auditData} onNext={handleNext} setStep={setCurrentStep} services={selectedServices} />;
            case 3:
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-premium-blue-900 mb-2">Audit Submitted!</h2>
                        <p className="text-slate-500 mb-10 max-w-sm">Detailed technical survey has been securely synced.</p>
                        <div className="flex justify-center w-full max-w-md px-6">
                            <Link to={`/audits/${auditData.id}`} className="flex items-center justify-center gap-2 p-4 bg-premium-blue-900 text-white rounded-2xl font-bold shadow-lg hover:bg-premium-blue-800 transition-all w-full">
                                <ClipboardCheck size={20} /> View Full Report
                            </Link>
                        </div>
                        <Link to="/audits" className="mt-8 text-sm font-medium text-slate-400 hover:text-slate-600">Back to Audit Dashboard</Link>
                    </div>
                );
            default: return null;
        }
    };

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
                    {/* Status Icons */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {isOffline && <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200"><AlertTriangle size={12} /> Offline</div>}
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {isSaving ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving...</span> : (lastSaved && <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Saved</span>)}
                        </div>
                    </div>
                </div>
                {/* Progress */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/50">
                    <div className="h-full bg-gradient-to-r from-premium-gold-400 to-premium-gold-600 transition-all duration-300" style={{ width: `${displayProgress}%` }} />
                </div>
            </div>

            <Toast message={localToast?.message} type={localToast?.type} onClose={() => setLocalToast(null)} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto py-10 px-6 pb-32">
                    {isFromLead && currentStep < 3 && (
                        <div className="mb-6 bg-premium-blue-50 border border-premium-blue-200 rounded-xl p-4 flex items-center gap-3">
                            <div className="bg-premium-blue-100 p-2 rounded-lg text-premium-blue-600"><ClipboardCheck size={20} /></div>
                            <div>
                                <h3 className="font-bold text-premium-blue-900 text-sm">Pre-populated from Lead</h3>
                                <p className="text-xs text-premium-blue-700">Client details imported from <span className="font-bold">{auditData.client?.clientName}</span>.</p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Actions */}
            {currentStep > 0 && currentStep < 3 && (
                <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-8">
                    <div className="w-full max-w-lg bg-white border border-slate-200 shadow-xl shadow-slate-900/10 rounded-2xl p-2 flex gap-3 pointer-events-auto items-center mx-4">
                        <button onClick={handleBack} className="py-3 px-6 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all">Back</button>
                        <button onClick={handleNext} disabled={isSaving} className={clsx("flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2", isSaving ? "bg-slate-400" : "bg-gradient-to-r from-premium-blue-900 to-premium-blue-800 hover:shadow-premium-blue-900/25")}>
                            {currentStep === 2 ? (isSaving ? "Saving..." : "Submit Audit") : "Continue"}
                        </button>
                    </div>
                </div>
            )}
            <SiteAuditFAB currentStep={currentStep} data={auditData} updateData={updateData} showToast={(msg, type) => setLocalToast({ message: msg, type })} />
        </div>
    );
}
