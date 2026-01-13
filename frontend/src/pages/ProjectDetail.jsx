import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../hooks/useFirestore';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Components
import ProjectHeader from '../components/projects/ProjectHeader';
import ProjectCommandCenter from '../components/projects/ProjectCommandCenter';
import ReportIssueModal from '../components/operations/ReportIssueModal';
import ScheduleVisitModal from '../components/projects/ScheduleVisitModal';

// Tabs
// Tabs
// TabOverview removed as ProjectCommandCenter replaces it
import TabTimeline from '../components/projects/tabs/TabTimeline';
import TabIssues from '../components/projects/tabs/TabIssues';
import TabProjectLog from '../components/projects/tabs/TabProjectLog';
import TabMaterials from '../components/projects/tabs/TabMaterials';
import TabPhotos from '../components/projects/tabs/TabPhotos';
import TabPayments from '../components/projects/tabs/TabPayments';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Data State
    const { data: rawProject, loading, error } = useDocument('projects', id);

    // Standardize Data for UI (Adapter Pattern)
    const project = rawProject ? {
        id,
        ...rawProject,
        clientInfo: rawProject.clientInfo || {
            name: rawProject.clientName || 'Unknown Client',
            address: rawProject.address || 'No Address',
            phone: rawProject.phone || '-'
        },
        status: rawProject.status || 'Planning',
        currentPhase: rawProject.phase || rawProject.currentPhase || 'Planning',
        progress: rawProject.progress || 0,
        timeline: rawProject.timeline || { expectedCompletion: rawProject.dueDate || 'TBD' },
        systemSpecs: rawProject.systemSpecs || rawProject.specs || { inverter: '-', battery: '-', solar: '-', value: rawProject.value || 0 },
        location: rawProject.location || rawProject.address || 'Unknown Location',
        team: rawProject.team || []
    } : null;

    // UI State
    const [activeTab, setActiveTab] = useState('Overview');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const handleQuickAction = async (actionId) => {
        if (actionId === 'report_issue') {
            setActiveTab('Issues');
            return;
        }

        if (actionId === 'complete_phase') {
            const phases = ['Planning', 'Procurement', 'Installation', 'Testing', 'Handover'];
            const currentIndex = phases.indexOf(project.currentPhase);

            if (currentIndex < phases.length - 1) {
                const nextPhase = phases[currentIndex + 1];
                const newProgress = Math.round(((currentIndex + 1) / (phases.length - 1)) * 100);

                const toastId = toast.loading(`Moving to ${nextPhase}...`);
                try {
                    const projectRef = doc(db, 'projects', id);
                    await updateDoc(projectRef, {
                        phase: nextPhase,
                        progress: newProgress,
                        updatedAt: serverTimestamp()
                    });
                    toast.success(`Project moved to ${nextPhase} phase!`, { id: toastId });
                } catch (err) {
                    console.error("Failed to update phase", err);
                    toast.error("Failed to update phase", { id: toastId });
                }
            } else {
                toast.success("Project is already in the final phase!");
            }
            return;
        }

        if (actionId === 'previous_phase') {
            const phases = ['Planning', 'Procurement', 'Installation', 'Testing', 'Handover'];
            const currentIndex = phases.indexOf(project.phase || project.currentPhase || 'Planning');

            if (currentIndex > 0) {
                const prevPhase = phases[currentIndex - 1];
                const newProgress = Math.round(((currentIndex - 1) / (phases.length - 1)) * 100);

                const toastId = toast.loading(`Reverting to ${prevPhase}...`);
                try {
                    const projectRef = doc(db, 'projects', id);
                    await updateDoc(projectRef, {
                        phase: prevPhase,
                        progress: newProgress,
                        updatedAt: serverTimestamp()
                    });
                    toast.success(`Project reverted to ${prevPhase} phase!`, { id: toastId });
                } catch (err) {
                    console.error("Failed to revert phase", err);
                    toast.error("Failed to revert phase", { id: toastId });
                }
            } else {
                toast.error("Project is already in the starting phase!");
            }
            return;
        }

        // Tool Hub & Smart Actions
        if (actionId === 'upload_photo') {
            setActiveTab('Photos');
        } else if (actionId === 'schedule_visit') {
            setIsScheduleModalOpen(true);
        } else if (actionId === 'view_audit') {
            // Check if audit exists or just show toast
            toast('Audit sync in progress...', { icon: '🔄' });
        } else if (actionId === 'message_client') {
            toast('Client messaging coming soon!', { icon: '💬' });
        } else if (actionId === 'view_report') {
            toast('Generating handover report...', { icon: '📄' });
        } else {
            toast(`Action '${actionId.replace(/_/g, ' ')}' triggered.`);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 p-6 space-y-6">
                <div className="h-20 bg-slate-200 animate-pulse rounded-xl w-full"></div>
                <div className="grid grid-cols-12 gap-6 h-[220px]">
                    <div className="col-span-12 lg:col-span-7 h-full bg-slate-200 animate-pulse rounded-xl"></div>
                    <div className="col-span-12 lg:col-span-5 h-full bg-slate-200 animate-pulse rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <EmptyState
                    icon={AlertCircle}
                    title="Project Not Found"
                    description={error || "The project you are looking for does not exist or has been deleted."}
                    action={
                        <button onClick={() => navigate('/projects')} className="text-blue-600 font-bold hover:underline">
                            Return to Projects
                        </button>
                    }
                />
            </div>
        );
    }

    const tabs = ['Overview', 'Materials', 'Project Log', 'Photos', 'Issues', 'Financials'];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* 1. Header */}
            <ProjectHeader project={project} />

            <div className="pt-4 px-4 sm:px-6 pb-6 max-w-[1600px] mx-auto w-full space-y-4 md:space-y-6">

                {/* 2. Main Content Area */}
                <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                    {/* Tab Header - Premium Integrated Styling */}
                    <div className="bg-slate-50/50 border-b border-slate-200 px-4 md:px-8 overflow-x-auto no-scrollbar">
                        <div className="flex gap-2 sm:gap-4 min-w-max">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 md:px-4 py-4 md:py-6 text-xs md:text-sm font-black transition-all relative ${activeTab === tab
                                        ? 'text-blue-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 md:p-8 flex-1">
                        {activeTab === 'Overview' && (
                            <ProjectCommandCenter
                                project={project}
                                onAction={handleQuickAction}
                                onNavigateToTab={setActiveTab}
                            />
                        )}
                        {activeTab === 'Materials' && <TabMaterials project={project} />}
                        {activeTab === 'Project Log' && <TabProjectLog project={project} />}
                        {activeTab === 'Photos' && <TabPhotos project={project} />}
                        {activeTab === 'Issues' && <TabIssues project={project} />}
                        {activeTab === 'Financials' && <TabPayments project={project} />}
                    </div>
                </div>

            </div>

            {/* Modals */}
            <ReportIssueModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                initialData={{
                    projectId: project.id,
                    location: project.location || '',
                }}
            />
            <ScheduleVisitModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                project={project}
            />
        </div>
    );
}

