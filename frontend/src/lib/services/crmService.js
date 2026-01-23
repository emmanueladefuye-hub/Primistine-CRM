import { db } from '../firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { SystemLogger, LOG_ACTIONS } from './SystemLogger';

export const crmService = {
    // --- LEADS ---
    addLead: async (leadData, userProfile, currentUser) => {
        const rawValue = typeof leadData.value === 'string'
            ? parseFloat(leadData.value.replace(/[^0-9.]/g, '')) || 0
            : Number(leadData.value || 0);

        const newLead = {
            ...leadData,
            value: rawValue,
            lastContact: new Date().toLocaleString(),
            activities: [],
            documents: [],
            companyId: userProfile?.companyId || 'default',
            createdBy: currentUser?.uid || 'system',
            createdByName: userProfile?.displayName || currentUser?.email?.split('@')[0] || 'System',
            createdAt: serverTimestamp(), // Use server timestamp
            updatedBy: currentUser?.uid || 'system'
        };

        const docRef = await addDoc(collection(db, 'leads'), newLead);
        await SystemLogger.log(LOG_ACTIONS.LEAD_CREATED, `Created new lead: ${leadData.name}`, {
            leadId: docRef.id,
            createdBy: currentUser?.uid
        });
        return { id: docRef.id, ...newLead };
    },

    updateLead: async (id, updates, currentUser) => {
        const docRef = doc(db, 'leads', id);
        await updateDoc(docRef, {
            ...updates,
            updatedBy: currentUser?.uid || 'system',
            updatedAt: serverTimestamp()
        });
        return true;
    },

    // --- CLIENTS ---
    addClient: async (clientData, userProfile, currentUser) => {
        const newClient = {
            ...clientData,
            companyId: userProfile?.companyId || 'default',
            createdBy: currentUser?.uid || 'system',
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'clients'), newClient);
        return { id: docRef.id, ...newClient };
    },

    // --- CONVERSION LOGIC ---
    convertLeadToClientAndProject: async (lead, userProfile, currentUser) => {
        // This is a complex atomic-like operation (can be moved to a Transaction later)
        const clientData = {
            name: lead.name,
            company: lead.company || lead.name,
            email: lead.email,
            phone: lead.phone,
            address: lead.address || 'Address pending',
            status: 'Active',
            source: 'Converted Lead',
            leadId: lead.id,
            dateJoined: new Date().toISOString().split('T')[0],
            value: lead.value || 0
        };

        const serviceType = lead.serviceInterest?.[0] || 'Solar';
        const projectData = {
            leadId: lead.id,
            name: `${serviceType} for ${lead.name}`,
            client: lead.company || lead.name,
            status: 'In Progress',
            phase: 'Planning',
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            budget: lead.value || 0,
            createdBy: currentUser?.uid || 'system',
            createdAt: serverTimestamp()
        };

        // Note: For now, we perform separate writes. 
        // In a true enterprise refactor, this would be a Firestore Transaction.
        const client = await crmService.addClient(clientData, userProfile, currentUser);
        const projectRef = await addDoc(collection(db, 'projects'), projectData);

        await SystemLogger.log(LOG_ACTIONS.PROJECT_CREATED, `Auto-created project for lead: ${lead.name}`, {
            leadId: lead.id,
            projectId: projectRef.id
        });

        return { client, projectId: projectRef.id };
    }
};
