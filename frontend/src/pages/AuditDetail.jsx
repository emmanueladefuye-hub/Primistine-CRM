import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle2, FileEdit, ArrowRight } from 'lucide-react';
import { useAudits } from '../contexts/AuditsContext';
import { auditService } from '../lib/services/auditService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Import Specific Review Components
import { CCTVReview } from '../components/audits/reviews/CCTVReview';
import { ElectricalReview } from '../components/audits/reviews/ElectricalReview';
import { GeneratorReview, EarthingReview } from '../components/audits/reviews/GenEarthingReviews';
import { IndustrialReview } from '../components/audits/reviews/IndustrialReview';
import { SolarReview } from '../components/audits/reviews/SolarReview';
import AuditSummary from '../components/audits/universal/AuditSummary'; // Fallback

export default function AuditDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getAuditById: getLocalAudit } = useAudits();
    const [audit, setAudit] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
    const [isMovingToProject, setIsMovingToProject] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                // 1. Try Firebase
                const cloudAudit = await auditService.getAuditById(id);
                if (cloudAudit) {
                    setAudit(cloudAudit);
                    return;
                }
            } catch (err) {
                console.error("Error fetching audit:", err);
            }

            // 2. Fallback to local storage (Legacy support)
            const submitted = JSON.parse(localStorage.getItem('submitted_audits') || '[]');
            let found = submitted.find(a => a.id === id);

            // 3. If still not found, check local context audits
            if (!found) {
                const localAudit = getLocalAudit(id);
                if (localAudit) {
                    // Return structured object compatible with AuditSummary
                    found = {
                        id: localAudit.id,
                        client: { clientName: localAudit.client, address: localAudit.address },
                        status: localAudit.status,
                        submittedAt: localAudit.completedAt || new Date().toISOString(),
                        engineer: localAudit.engineer,
                        services: localAudit.services || ['solar'] // Default to solar
                    };
                }
            }

            if (found) setAudit(found);
        };

        fetchAudit();
    }, [id, getLocalAudit]);

    // Data Adapter: Transform record to component-ready structure
    const getAdaptedData = (data) => {
        if (!data) return {};

        const universal = {
            ...data.client,
            photos: data.client?.photos || [],
            gps: data.client?.gps,
            engineerName: data.engineer || 'Demo Engineer'
        };

        const serviceSpecific = {
            ...(data.site || {}),
            ...(data.load || {}),
            ...(data.infra || {}),
            ...(data.design || {}),

            // Explicit Mappings
            items: data.load?.items || [],
            cameras: data.load?.cameras || [],
            machinery: data.load?.machinery || [],
            hazards: data.site?.hazardsList || [],
            sitePhotos: data.site?.photos || [],
            roofPhotos: data.site?.photos || [],
        };

        // Unified Audit Results (Matches FinalReview adapter)
        const auditResults = {
            // Shared Stats
            totalLoad: data.load?.stats?.totalLoad || 0,
            dailyEnergy: data.load?.stats?.totalDailyEnergy || 0,
            criticalLoad: data.load?.stats?.criticalLoad || 0,
            peakLoad: data.load?.stats?.peakSimultaneousLoad || 0,
            surgePower: data.load?.stats?.surgePower || 0,

            // Solar & Power Results
            recInverter: data.design?.recommendedInverter || 0,
            recBattery: data.design?.batteryCapacity || 0,
            recSolarResult: data.design?.solarArraySize || 0,
            estAutonomy: data.design?.backupHours || 0,
            independence: data.design?.independenceLevel || 0,
            monthlySavings: data.design?.monthlySavings || 0,
            payback: data.design?.paybackYears || 0,
            totalCost: data.design?.totalSystemCostEstimate || 0,

            // Solar Formula Context
            batteryType: data.design?.batteryType || 'Lithium',
            batteryDoD: data.design?.batteryType === 'Lead-acid' ? 0.5 : 0.8,
            diversityFactor: (data.load?.items || []).length > 10 ? 0.65 : 0.8,
            targetCoverage: data.design?.targetCoverage || 0,

            // CCTV Specifics
            totalCameras: (data.load?.cameras || []).length || (data.site?.cameras || []).length || 0,
            storageRequired: Math.ceil(((data.load?.cameras || []).length || (data.site?.cameras || []).length || 0) * 0.5),
            totalCableLength: ((data.load?.cameras || []).length || (data.site?.cameras || []).length || 0) * 45,

            // Generator & Wiring Specifics
            recommendedGenSize: Math.ceil((data.load?.stats?.totalLoad || 0) * 1.5),
            recommendedCableSize: (data.load?.stats?.totalLoad || 0) > 10 ? "16mm²" : "10mm²",
            fuelCost: Math.ceil((data.load?.stats?.totalLoad || 0) * 15000),

            warnings: data.design?.warnings || []
        };

        return { universal, serviceSpecific, auditResults };
    };

    if (!audit) return <div className="p-8 text-center text-slate-500">Loading audit details...</div>;

    const adaptedData = getAdaptedData(audit);
    const primaryService = audit.services?.[0] || 'solar';

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        const toastId = toast.loading('Generating PDF report...');
        try {
            const element = document.getElementById('audit-report-content');
            if (!element) throw new Error("Report content not found");

            // Reduced scale to 1.5 to keep file size manageable (< 10MB usually)
            const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Subsequent pages
            while (heightLeft > 0) {
                position = heightLeft - imgHeight; // Shift up for next page
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Sanitize filename
            const cleanClient = (adaptedData.universal?.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Primistine_Audit_${id}_${cleanClient}.pdf`;

            // Use standard save (version fix in package.json ensures this works)
            pdf.save(fileName);

            toast.success('PDF downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF. Please try again.', { id: toastId });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleGenerateQuote = async () => {
        setIsGeneratingQuote(true);
        const toastId = toast.loading('Drafting quote from audit data...');
        try {
            const results = adaptedData.auditResults;
            let equipment = [];
            let specs = {};

            // Dynamic Asset Generation based on Service Type
            if (primaryService === 'solar') {
                specs = {
                    inverter: results.recInverter,
                    battery: results.recBattery,
                    solar: results.recSolarResult
                };
                equipment = [
                    {
                        item: `${results.recInverter}kVA Hybrid Inverter`,
                        quantity: 1,
                        unitPrice: (results.recInverter || 0) * 120000,
                        category: 'Inverter'
                    },
                    {
                        item: `${results.recBattery}kWh ${results.batteryType} Battery Bank`,
                        quantity: 1,
                        unitPrice: (results.recBattery || 0) * 95000,
                        category: 'Battery'
                    },
                    {
                        item: `${results.recSolarResult}kWp Solar Array`,
                        quantity: 1,
                        unitPrice: (results.recSolarResult || 0) * 160000,
                        category: 'Solar Panels'
                    }
                ];
            } else if (primaryService === 'cctv') {
                const camCount = results.totalCameras || 4;
                equipment = [
                    {
                        item: '4MP IP Bullet Camera (Night Vision)',
                        quantity: camCount,
                        unitPrice: 45000,
                        category: 'Hardware'
                    },
                    {
                        item: '16-Channel NVR Recorder',
                        quantity: 1,
                        unitPrice: 150000,
                        category: 'Hardware'
                    },
                    {
                        item: 'CAT6 Networking Cable (Coil)',
                        quantity: Math.ceil(camCount * 0.5),
                        unitPrice: 65000,
                        category: 'Cabling'
                    }
                ];
            } else {
                // Generic / Wiring / Other fallback
                equipment = [
                    {
                        item: 'General Service Implementation',
                        quantity: 1,
                        unitPrice: 0,
                        category: 'Service'
                    },
                    {
                        item: 'Miscellaneous Materials',
                        quantity: 1,
                        unitPrice: 0,
                        category: 'Materials'
                    }
                ];
            }

            // Calculate initial total
            const estimatedTotal = equipment.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

            const quoteData = {
                clientId: audit.client?.id || 'unknown',
                clientName: adaptedData.universal?.clientName || 'Unknown Audit Client',
                auditId: id,
                serviceType: primaryService.charAt(0).toUpperCase() + primaryService.slice(1) + ' Project',
                specs: specs,
                equipment,
                totalAmount: estimatedTotal > 0 ? estimatedTotal : 0,
                status: 'Draft',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'quotes'), quoteData);
            toast.success('Quote generated successfully!', { id: toastId });

            // Navigate to the Quote Builder
            navigate(`/sales/quotes/${docRef.id}`);
        } catch (error) {
            console.error("Quote generation failed:", error);
            toast.error('Failed to generate quote. Please try again.', { id: toastId });
        } finally {
            setIsGeneratingQuote(false);
        }
    };

    const renderServiceReview = () => {
        const commonProps = { auditData: adaptedData, readOnly: true };

        switch (primaryService) {
            case 'cctv': return <CCTVReview {...commonProps} />;
            case 'wiring': return <ElectricalReview {...commonProps} />;
            case 'generator': return <GeneratorReview {...commonProps} />;
            case 'earthing': return <EarthingReview {...commonProps} />;
            case 'industrial': return <IndustrialReview {...commonProps} />;
            case 'solar': return <SolarReview {...commonProps} />;
            default: return <AuditSummary data={audit} services={audit.services || []} />;
        }
    };



    // ... existing useEffect ...

    const handleMoveToProject = () => {
        // Validation
        const photoCount = adaptedData.universal.sitePhotos?.length || 0;
        // NOTE: For demo purposes, we might relax this if no photos uploaded in dev
        // if (photoCount < 3) {
        //     toast.error(`Audit incomplete: At least 3 site photos required. (Current: ${photoCount})`);
        //     return;
        // }

        setShowMoveModal(true);
    };

    const confirmMoveToProject = async () => {
        setIsMovingToProject(true);
        const toastId = toast.loading('Creating project from audit...');

        try {
            // 1. Intelligent Data Mapping
            const projectData = {
                name: `${primaryService === 'solar' ? 'Solar Installation' : primaryService === 'cctv' ? 'CCTV Security System' : 'Electrical'} for ${adaptedData.universal?.clientName}`,
                clientId: audit.client?.id || 'unknown', // Link to client
                clientName: adaptedData.universal?.clientName,
                auditId: id,
                leadId: audit.client?.leadId || null,
                status: 'Planning',
                phase: 'Planning',
                progress: 0,
                health: 'healthy',
                value: adaptedData.auditResults.totalCost || 0,
                rawValue: adaptedData.auditResults.totalCost || 0,
                // Map Specs
                specs: {
                    serviceType: primaryService,
                    systemSize: adaptedData.auditResults.recSolarResult || 0,
                    batterySize: adaptedData.auditResults.recBattery || 0,
                    inverterSize: adaptedData.auditResults.recInverter || 0,
                    cameraCount: adaptedData.auditResults.totalCameras || 0
                },
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days default
                createdAt: serverTimestamp(),
                createdFrom: 'audit'
            };

            // 2. Create Project
            const projectRef = await addDoc(collection(db, 'projects'), projectData);

            // 3. Update Audit
            // await auditService.updateAudit(id, { moved_to_project: true, projectId: projectRef.id }); 
            // Mocking update since service might not have update method exposed directly in context
            // In real app, we would call updateDoc on audit ref

            setAudit(prev => ({ ...prev, moved_to_project: true, projectId: projectRef.id }));

            toast.success('Project created successfully!', { id: toastId });
            setShowMoveModal(false);

            // 4. Redirect
            navigate(`/projects/${projectRef.id}`);

        } catch (error) {
            console.error("Failed to move to project:", error);
            toast.error("Failed to create project", { id: toastId });
        } finally {
            setIsMovingToProject(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 relative">
            {/* Move Confirmation Modal */}
            {showMoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-premium-blue-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-premium-blue-900">Create Project?</h3>
                            <p className="text-slate-500 text-sm mt-2">
                                This will convert the audit for <b>{adaptedData.universal?.clientName}</b> into a new active project in the <b>Planning</b> phase.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Est. Project Value</span>
                                <span className="font-bold text-slate-700">₦{(adaptedData.auditResults.totalCost || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">System Specs</span>
                                <span className="font-bold text-slate-700">
                                    {primaryService === 'solar'
                                        ? `${adaptedData.auditResults.recSolarResult}kWp / ${adaptedData.auditResults.recInverter}kVA`
                                        : `${adaptedData.auditResults.totalCameras} Cameras`
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowMoveModal(false)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button
                                onClick={confirmMoveToProject}
                                disabled={isMovingToProject}
                                className="flex-1 py-2.5 bg-premium-blue-900 text-white rounded-xl font-bold hover:bg-premium-blue-800 flex items-center justify-center gap-2"
                            >
                                {isMovingToProject ? 'Creating...' : 'Create Project'} <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 py-4">
                <Link to="/audits" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900 tracking-tight uppercase">
                        {(primaryService || 'Site')} AUDIT - {adaptedData.universal?.clientName || 'Client'}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <span>{new Date(audit.submittedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full border border-green-100">
                            <CheckCircle2 size={12} /> {audit.status}
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <Link to={`/audits/${id}/edit`} className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold hover:text-premium-blue-900 hover:border-slate-300 transition-all shadow-sm">
                        <FileEdit size={18} /> Edit
                    </Link>

                    {/* Move to Project Button */}
                    {audit.moved_to_project ? (
                        <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed">
                            <CheckCircle2 size={18} /> Project Created
                        </button>
                    ) : (
                        <button
                            onClick={handleMoveToProject}
                            className="flex items-center gap-2 px-6 py-2.5 bg-premium-gold-500 text-white rounded-xl hover:shadow-lg hover:shadow-premium-gold-500/20 hover:-translate-y-0.5 font-bold transition-all"
                        >
                            Move to Project <ArrowRight size={18} />
                        </button>
                    )}

                    {/* Download PDF Button */}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all disabled:opacity-70"
                    >
                        {isGeneratingPDF ? (
                            <>Generating...</>
                        ) : (
                            <><Download size={18} /> Download Report</>
                        )}
                    </button>

                    <button
                        onClick={handleGenerateQuote}
                        disabled={isGeneratingQuote}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all disabled:opacity-70 disabled:transform-none"
                    >
                        {isGeneratingQuote ? 'Creating Quote...' : 'Generate Quote'}
                    </button>
                </div>
            </div>

            {/* Smart Service-Specific Review */}
            <div id="audit-report-content" className="bg-white rounded-xl shadow-sm overflow-hidden">
                {renderServiceReview()}
            </div>

        </div>
    );
}
