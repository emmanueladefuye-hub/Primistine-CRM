import React, { createContext, useContext, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc, orderBy,
    query, where, getDocs, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { limit } from 'firebase/firestore';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { useScopedPagination } from '../hooks/useScopedPagination';
import { toast } from 'react-hot-toast';
// Mocks removed
import { PIPELINE_STAGES } from '../lib/constants';
import { useProjects } from './ProjectsContext';
import { useClients } from './ClientsContext';
import { useAuth } from './AuthContext';
import { SystemLogger, LOG_ACTIONS } from '../lib/services/SystemLogger';

export const LeadsContext = createContext();

export function useLeads() {
    const context = useContext(LeadsContext);
    if (!context) {
        throw new Error('useLeads must be used within a LeadsProvider');
    }
    return context;
}

export function LeadsProvider({ children }) {
    const { currentUser, userProfile } = useAuth();
    const { addProject } = useProjects();
    const { addClient } = useClients();

    // 1. Limited Real-time Subscription (Top 100 for Board View)
    // Prevents crashing the browser with 1000s of leads on initial load
    const leadsQuery = React.useMemo(() => [orderBy('createdAt', 'desc'), limit(100)], []);
    const { data: leads, loading: collectionLoading, error: collectionError } = useScopedCollection('leads', leadsQuery);

    // 2. Paginated Subscription (Infinite Scroll for List View)
    const {
        data: pagedLeads,
        loading: pagedLoading,
        hasMore: leadsHasMore,
        loadMore: loadMoreLeads
    } = useScopedPagination('leads', [orderBy('createdAt', 'desc')], 20);

    const loading = collectionLoading || (pagedLoading && pagedLeads.length === 0);
    const error = collectionError;

    const addLead = async (leadData) => {
        try {
            const rawValue = typeof leadData.value === 'string'
                ? parseFloat(leadData.value.replace(/[^0-9.]/g, '')) || 0
                : Number(leadData.value || 0);

            const newLead = {
                ...leadData,
                value: rawValue, // Store as number
                lastContact: 'Just now',
                activities: [],
                documents: [],
                companyId: userProfile?.companyId || 'default', // RBAC scoping
                createdBy: currentUser?.uid || 'system',        // RBAC scoping
                createdAt: new Date().toISOString(),
                updatedBy: currentUser?.uid || 'system'
            };

            // Let Firestore generate a random string ID
            const docRef = await addDoc(collection(db, 'leads'), newLead);

            await SystemLogger.log(LOG_ACTIONS.LEAD_CREATED, `Created new lead: ${leadData.name}`, {
                leadId: docRef.id,
                leadName: leadData.name,
                value: rawValue,
                createdBy: currentUser?.uid || 'system'
            });

            // If we need the ID in the object for local state (though useCollection handles it),  
            // we can update it if needed, but usually doc.id is better.
            toast.success('Lead added successfully');
            return docRef.id;
        } catch (err) {
            console.error('Error adding lead:', err);
            toast.error('Failed to add lead');
            throw err; // Re-throw for component-level handling
        }
    };

    const updateLead = async (id, updates) => {
        try {
            // We need to find the document ref. Since we are using useCollection which gives us data + id (firestore id),
            // and the app might be passing the numeric 'id' field.
            // However, useCollection maps doc.id to .id. 
            // WAIT: useCollection usually maps the document ID to the `id` field.
            // But I am saving `id: Date.now()` in the document. This creates a duplicate ID problem.
            // Phase 1/2 fixed this by using the Firestore ID.
            // Let's assume the ID passed here IS the Firestore ID (string).
            // If it's a number, it might be legacy or from the object.id. 
            // Ideally we migrate to using Firestore IDs (strings).

            const docRef = doc(db, 'leads', String(id));
            await updateDoc(docRef, updates);

            await SystemLogger.log(LOG_ACTIONS.LEAD_UPDATED, `Updated lead: ${id}`, {
                leadId: id,
                updates: Object.keys(updates),
                updatedBy: currentUser?.uid || 'system'
            });

            toast.success('Lead updated');
        } catch (err) {
            console.error('Error updating lead:', err);
            toast.error('Failed to update lead');
        }
    };

    const deleteLead = async (id) => {
        try {
            const docRef = doc(db, 'leads', String(id));
            await deleteDoc(docRef);
            toast.success('Lead deleted');
        } catch (err) {
            console.error('Error deleting lead:', err);
            toast.error('Failed to delete lead');
        }
    };

    // Helper to add activity
    const addActivity = useCallback(async (leadId, type, text, user = null) => {
        const activityUser = user || (currentUser?.displayName || currentUser?.email || 'System');
        const newActivity = {
            id: Date.now(),
            type,
            text,
            date: new Date().toLocaleString(),
            user: activityUser
        };

        try {
            const docRef = doc(db, 'leads', String(leadId));
            await updateDoc(docRef, {
                activities: arrayUnion(newActivity)
            });
        } catch (err) {
            console.error("Error adding activity", err);
        }
    }, [currentUser]);

    const addNote = useCallback((leadId, noteText) => {
        addActivity(leadId, 'note', noteText);
    }, [addActivity]);

    // Helper to create client from lead
    const createClientFromLead = useCallback(async (lead) => {
        try {
            // 1. Check if client with this leadId exists
            const qLeadId = query(collection(db, 'clients'), where('leadId', '==', lead.id));
            const snapLeadId = await getDocs(qLeadId);
            if (!snapLeadId.empty) return;

            // 2. Check if client with this email exists
            if (lead.email) {
                const qEmail = query(collection(db, 'clients'), where('email', '==', lead.email));
                const snapEmail = await getDocs(qEmail);
                if (!snapEmail.empty) return;
            }

            await addClient({
                name: lead.name,
                company: lead.company,
                email: lead.email,
                phone: lead.phone,
                address: lead.address || 'Address pending',
                status: 'Active',
                source: 'Converted Lead',
                leadId: lead.id,
                dateJoined: new Date().toISOString().split('T')[0],
                totalProjects: 1,
                value: lead.value || 0,
                notes: lead.notes || '',
                companyId: userProfile?.companyId || 'default', // RBAC scoping
                createdBy: currentUser?.uid || 'system'         // RBAC scoping
            });

        } catch (error) {
            console.error('Error creating client from lead:', error);
        }
    }, [addClient]);

    // Helper to create project from lead
    const createProjectFromLead = useCallback(async (lead) => {
        try {
            const q = query(collection(db, 'projects'), where('leadId', '==', lead.id));
            const snap = await getDocs(q);

            if (!snap.empty) {
                console.log('Project already exists for this lead');
                return;
            }

            const serviceType = lead.serviceInterest?.[0] || 'Solar';

            await addProject({
                leadId: lead.id,
                name: `${serviceType} for ${lead.name}`,
                client: lead.company || lead.name,
                clientInfo: {
                    name: lead.name,
                    address: lead.address || 'Address pending',
                    phone: lead.phone || 'No phone provided'
                },
                status: 'In Progress',
                phase: 'Planning',
                progress: 0,
                health: 'healthy',
                startDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                budget: lead.value || 0,
                value: lead.value || 0,
                spent: 0,
                systemSpecs: {
                    serviceType: serviceType.toLowerCase(),
                    inverter: '-',
                    battery: '-',
                    solar: '-',
                    value: lead.value || 0
                },
                team: [],
                tasks: { todo: [], inProgress: [], completed: [] },
                manager: currentUser?.displayName || 'Unassigned',
                description: `Project auto-created from won lead. Notes: ${lead.notes || 'None'}`,
                priority: 'High',
                createdAt: serverTimestamp(),
                createdFrom: 'lead',
                companyId: userProfile?.companyId || 'default', // RBAC scoping
                createdBy: currentUser?.uid || 'system'         // RBAC scoping
            });

            await SystemLogger.log(LOG_ACTIONS.PROJECT_CREATED, `Auto-created project for lead: ${lead.name}`, {
                leadId: lead.id,
                serviceType,
                value: lead.value
            });

        } catch (error) {
            console.error('Error creating project from lead:', error);
        }
    }, [addProject, currentUser]);

    // Move lead to a different stage
    const moveLeadStage = useCallback(async (id, newStage) => {
        if (!leads) return;
        const lead = leads.find(l => String(l.id) === String(id));
        if (!lead) return;

        // Trigger conversion ONLY when moving to 'won' from a non-won stage
        if (newStage === 'won' && lead.stage !== 'won') {
            await createClientFromLead(lead);
            await createProjectFromLead(lead);
        }

        if (lead.stage !== newStage) {
            const oldStageName = PIPELINE_STAGES.find(s => s.id === lead.stage)?.name || lead.stage;
            const newStageName = PIPELINE_STAGES.find(s => s.id === newStage)?.name || newStage;
            await addActivity(id, 'status', `Moved from ${oldStageName} to ${newStageName}`);
            await updateLead(id, {
                stage: newStage,
                lastContact: 'Just now',
                stageUpdatedAt: new Date().toISOString()
            });

            await SystemLogger.log(LOG_ACTIONS.LEAD_UPDATED, `Changed stage to ${newStageName}`, {
                leadId: id,
                oldStage: lead.stage,
                newStage: newStage,
                userId: currentUser?.uid || 'system'
            });
        }
    }, [leads, createClientFromLead, createProjectFromLead, addActivity, updateLead]);

    const getLeadById = (id) => {
        if (!leads) return null;
        return leads.find(l => String(l.id) === String(id));
    };

    const resetLeads = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    return (
        <LeadsContext.Provider value={{
            leads, pagedLeads, loading, error,
            leadsHasMore, loadMoreLeads,
            addLead, updateLead, deleteLead,
            moveLeadStage,
            createClientFromLead,
            createProjectFromLead,
            resetLeads, addActivity, addNote,
            pipelineStages: PIPELINE_STAGES,
            getLeadById
        }}>
            {children}
        </LeadsContext.Provider>
    );
}
