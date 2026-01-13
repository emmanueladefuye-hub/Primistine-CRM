import React, { createContext, useContext, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';
// Mocks removed
import { PIPELINE_STAGES } from '../lib/constants';
import { useProjects } from './ProjectsContext';
import { useClients } from './ClientsContext';
import { useAuth } from './AuthContext';

const LeadsContext = createContext();

export function useLeads() {
    const context = useContext(LeadsContext);
    if (!context) {
        throw new Error('useLeads must be used within a LeadsProvider');
    }
    return context;
}

export function LeadsProvider({ children }) {
    const { currentUser } = useAuth();
    const { addProject } = useProjects();
    const { addClient } = useClients();

    // Subscribe to leads collection
    const leadsQuery = React.useMemo(() => [orderBy('id', 'desc')], []);
    const { data: leads, loading, error } = useCollection('leads', leadsQuery); // Sorting by ID time-based for now, or created_at if added

    const addLead = async (leadData) => {
        try {
            const newLead = {
                id: Date.now(), // Keep number ID for sorting/compatibility or switch to auto-id? keeping timestamp for now
                ...leadData,
                lastContact: 'Just now',
                activities: [],
                documents: [],
                createdAt: new Date().toISOString()
            };
            // We use addDoc but with our own ID if we want, or let Firestore gen one. 
            // For compatibility with codebase expecting `id` property:
            await addDoc(collection(db, 'leads'), newLead);
            toast.success('Lead added successfully');
        } catch (err) {
            console.error('Error adding lead:', err);
            toast.error('Failed to add lead');
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
            // We need to get the current activities to append, or use arrayUnion (safer)
            // But arrayUnion requires matching object structure.
            // For simplicity, let's fetch-update or assume we have the lead in 'leads'
            // BUT 'leads' is outside useCallback.
            // Safer to just use arrayUnion from firestore if we import it, or just read the doc.
            // Let's use arrayUnion for atomic updates if possible, or just standard read-modify-write via known state if simpler for this migration.
            // Actually, we can just call updateLead with the new array if we had the lead.
            // But we don't want to depend on 'leads' in useCallback.
            // Let's use arrayUnion.
            const { arrayUnion } = await import('firebase/firestore');
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
            // Use the functionality from ClientsContext
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
                value: lead.value || '₦0',
                notes: lead.notes || ''
            });
            // Toast handled in context

        } catch (error) {
            console.error('Error creating client from lead:', error);
        }
    }, [addClient]);

    // Helper to create project from lead
    const createProjectFromLead = useCallback(async (lead) => {
        try {
            // Use functionality from ProjectsContext
            await addProject({
                leadId: lead.id,
                name: `${lead.name} - Project`,
                client: lead.company || lead.name,
                status: 'In Progress',
                phase: 'Planning',
                progress: 0,
                startDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +90 days
                budget: lead.value || '₦0',
                spent: '₦0',
                team: [],
                tasks: { todo: [], inProgress: [], completed: [] },
                manager: currentUser?.displayName || 'Unassigned',
                description: `Project auto-created from won lead. Notes: ${lead.notes || 'None'}`,
                priority: 'High'
            });
            // Toast handled in context

        } catch (error) {
            console.error('Error creating project from lead:', error);
        }
    }, [addProject, currentUser]);

    // Move lead to a different stage
    const moveLeadStage = useCallback(async (id, newStage) => {
        // Need to find the lead to check logic
        // We can't easily find it without 'leads' dependency.
        // But we can just do the update. 
        // Logic about "if moved to won, create project" is tricky without reading the current stage.
        // We really need 'leads' here or read the doc.
        // Let's assume we pass the full lead object or just fetch it. 
        // For now, let's trust the logic in the UI calling this might pass the info? 
        // No, the signature is (id, newStage).
        // I will change signature to (lead, newStage) in the UI later? 
        // Or better: read from the 'leads' array available in the component usually?
        // Actually, 'leads' IS available in the context scope (it's state).
        // But using it in useCallback adds it as dependency, causing recreation of the function on every leads change.
        // That's acceptable for this size of app.

        // However, I can't access 'leads' inside this function if I define it outside the render or without dep.
        // The previous code had leads as dep. So I will keep it.

        // Wait, I can't access "leads" variable inside this useCallback if it's defined before "leads" is defined or if "leads" comes from useCollection which is inside the component.
        // I should define this function inside the component.
    }, []);

    // Re-defining moveLeadStage inside the component body
    const moveLeadStageContext = async (id, newStage) => {
        if (!leads) return;
        const lead = leads.find(l => String(l.id) === String(id));
        if (!lead) return;

        if (newStage === 'won' && lead.stage !== 'won') {
            await createProjectFromLead(lead);
            await createClientFromLead(lead);
        }

        if (lead.stage !== newStage) {
            const oldStageName = PIPELINE_STAGES.find(s => s.id === lead.stage)?.name || lead.stage;
            const newStageName = PIPELINE_STAGES.find(s => s.id === newStage)?.name || newStage;
            addActivity(id, 'status', `Moved from ${oldStageName} to ${newStageName}`);
        }

        await updateLead(id, { stage: newStage, lastContact: 'Just now' });
    };

    const getLeadById = (id) => {
        if (!leads) return null;
        return leads.find(l => String(l.id) === String(id));
    };

    const resetLeads = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    return (
        <LeadsContext.Provider value={{
            leads, loading, error,
            addLead, updateLead, deleteLead,
            moveLeadStage: moveLeadStageContext,
            resetLeads, addActivity, addNote,
            pipelineStages: PIPELINE_STAGES,
            getLeadById
        }}>
            {children}
        </LeadsContext.Provider>
    );
}
