import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc, orderBy,
    query, where, getDocs, serverTimestamp, arrayUnion, limit
} from 'firebase/firestore';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { useScopedPagination } from '../hooks/useScopedPagination';
import { toast } from 'react-hot-toast';
import { PIPELINE_STAGES } from '../lib/constants';
import { useAuth } from './AuthContext';
import { SystemLogger, LOG_ACTIONS } from '../lib/services/SystemLogger';
import { projectService } from '../lib/services/projectService';
import { LEAD_WORKFLOW_RULES, STAGE_ORDER, validateMove } from '../lib/workflowRules';

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

    // 1. Limited Real-time Subscription (Top 100 for Board View)
    const leadsQuery = useMemo(() => [orderBy('createdAt', 'desc'), limit(100)], []);
    const { data: leads, loading: collectionLoading, error: collectionError } = useScopedCollection('leads', leadsQuery);

    // 2. Paginated Subscription (Infinite Scroll for List View)
    const {
        data: pagedLeads,
        loading: pagedLoading,
        hasMore: leadsHasMore,
        loadMore: loadMoreLeads
    } = useScopedPagination('leads', [orderBy('createdAt', 'desc')], 20);

    const loading = collectionLoading || (pagedLoading && (pagedLeads?.length === 0));
    const error = collectionError;

    const addLead = async (leadData) => {
        try {
            const rawValue = typeof leadData.value === 'string'
                ? parseFloat(leadData.value.replace(/[^0-9.]/g, '')) || 0
                : Number(leadData.value || 0);

            const newLead = {
                ...leadData,
                value: rawValue,
                lastContact: 'Just now',
                activities: [],
                documents: [],
                companyId: userProfile?.companyId || 'default',
                createdBy: currentUser?.uid || 'system',
                createdAt: new Date().toISOString(),
                updatedBy: currentUser?.uid || 'system'
            };

            const docRef = await addDoc(collection(db, 'leads'), newLead);

            await SystemLogger.log(LOG_ACTIONS.LEAD_CREATED, `Created new lead: ${leadData.name}`, {
                leadId: docRef.id,
                leadName: leadData.name,
                value: rawValue,
                createdBy: currentUser?.uid || 'system'
            });

            toast.success('Lead added successfully');
            return docRef.id;
        } catch (err) {
            console.error('Error adding lead:', err);
            toast.error('Failed to add lead');
            throw err;
        }
    };

    const updateLead = async (id, updates) => {
        try {
            const docRef = doc(db, 'leads', String(id));
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

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

    const createClientFromLead = useCallback(async (lead) => {
        try {
            const qLeadId = query(collection(db, 'clients'), where('leadId', '==', lead.id));
            const snapLeadId = await getDocs(qLeadId);
            if (!snapLeadId.empty) return;

            if (lead.email) {
                const qEmail = query(collection(db, 'clients'), where('email', '==', lead.email));
                const snapEmail = await getDocs(qEmail);
                if (!snapEmail.empty) return;
            }

            const clientsRef = collection(db, 'clients');
            await addDoc(clientsRef, {
                name: lead.name,
                company: lead.company || '',
                email: lead.email || '',
                phone: lead.phone || '',
                address: lead.address || 'Address pending',
                status: 'Active',
                source: 'Converted Lead',
                leadId: lead.id,
                dateJoined: new Date().toISOString().split('T')[0],
                totalProjects: 1,
                value: lead.value || 0,
                notes: lead.notes || '',
                companyId: userProfile?.companyId || 'default',
                createdBy: currentUser?.uid || 'system',
                attribution: lead.attribution || {}
            });

        } catch (error) {
            console.error('Error creating client from lead:', error);
        }
    }, [currentUser, userProfile]);

    const createProjectFromLead = useCallback(async (lead) => {
        try {
            const serviceType = lead.serviceInterest?.[0] || 'Solar';

            const projectData = {
                name: `${serviceType} for ${lead.name}`,
                client: lead.company || lead.name,
                clientId: lead.id,
                clientInfo: {
                    name: lead.name,
                    address: lead.address || 'Address pending',
                    phone: lead.phone || 'No phone provided',
                    email: lead.email || ''
                },
                systemSpecs: {
                    serviceType: serviceType.toLowerCase(),
                    value: lead.value || 0
                },
                description: `Project auto-created from won lead. Notes: ${lead.notes || 'None'}`,
                createdFrom: 'lead',
                attribution: lead.attribution || {}
            };

            const result = await projectService.createProjectFromX('lead', lead.id, projectData, currentUser);

            if (!result.alreadyExists) {
                toast.success(`Project launched for ${lead.name}`);
            }

        } catch (error) {
            console.error('Error creating project from lead:', error);
            toast.error('Failed to auto-create project');
        }
    }, [currentUser]);

    const moveLeadStage = useCallback(async (id, newStage) => {
        if (!leads) return;
        const lead = leads.find(l => String(l.id) === String(id));
        if (!lead) return;

        // --- Workflow Validation (Sequential & Rules) ---
        const error = validateMove(lead, newStage);
        if (error) {
            const err = new Error(error.message);
            err.code = 'WORKFLOW_VALIDATION_FAILED';
            err.stageId = error.stageId;
            throw err;
        }
        // ---------------------------

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
    }, [leads, createClientFromLead, createProjectFromLead, addActivity, updateLead, currentUser]);

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
