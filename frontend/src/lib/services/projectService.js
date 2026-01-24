import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SystemLogger, LOG_ACTIONS } from './SystemLogger';

export const projectService = {
    /**
     * Centralized method to create a project from another entity (Lead, Audit, Quote)
     * Handles idempotency (checks if project already exists) and auto-client creation.
     */
    createProjectFromX: async (sourceType, sourceId, data, currentUser) => {
        try {
            const projectsRef = collection(db, 'projects');
            const sourceFieldMap = {
                'lead': 'leadId',
                'audit': 'auditId',
                'quote': 'quoteId'
            };

            const field = sourceFieldMap[sourceType];
            if (!field) throw new Error(`Invalid source type: ${sourceType}`);

            // 1. Idempotency Check
            const q = query(projectsRef, where(field, '==', sourceId));
            const snap = await getDocs(q);

            if (!snap.empty) {
                console.warn(`Project already exists for ${sourceType} ${sourceId}`);
                const existing = snap.docs[0];
                return { id: existing.id, ...existing.data(), alreadyExists: true };
            }

            // 2. Ensure Client exists in 'clients' collection if linked
            if (data.clientId && data.clientName) {
                const clientsRef = collection(db, 'clients');
                const clientQ = query(clientsRef, where('leadId', '==', data.leadId || sourceId));
                const clientSnap = await getDocs(clientQ);

                if (clientSnap.empty) {
                    console.log('Client not found, auto-creating client record...');
                    await addDoc(clientsRef, {
                        ...data.clientInfo,
                        name: data.clientName,
                        leadId: data.leadId || null,
                        status: 'Active',
                        createdAt: serverTimestamp(),
                        createdBy: currentUser?.uid || 'system'
                    });
                }
            }

            // 3. Create Project
            const projectData = {
                ...data,
                [field]: sourceId,
                status: data.status || 'Active',
                phase: data.phase || 'Planning',
                progress: data.progress || 0,
                health: data.health || 'healthy',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: currentUser?.uid || 'system'
            };

            const docRef = await addDoc(projectsRef, projectData);

            await SystemLogger.log(LOG_ACTIONS.PROJECT_CREATED, `Project auto-created from ${sourceType}`, {
                projectId: docRef.id,
                sourceId,
                sourceType,
                createdBy: currentUser?.uid || 'system'
            });

            return { id: docRef.id, ...projectData };
        } catch (error) {
            console.error(`Error in createProjectFromX (${sourceType}):`, error);
            throw error;
        }
    }
};
