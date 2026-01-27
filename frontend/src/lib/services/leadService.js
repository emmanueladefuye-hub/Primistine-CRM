import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PIPELINE_STAGES } from '../constants';
import { validateMove } from '../workflowRules';

export const leadService = {
    /**
     * Fetch a single lead by ID
     * @param {string} id 
     * @returns {Promise<object>} lead data with id
     */
    getLeadById: async (id) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        const fetchAttempt = async (attempt = 1) => {
            try {
                const docRef = doc(db, 'leads', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() };
                }

                if (attempt <= MAX_RETRIES) {
                    console.log(`Lead not found, retrying... (${attempt}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    return fetchAttempt(attempt + 1);
                }

                return null;
            } catch (error) {
                if (attempt <= MAX_RETRIES) {
                    console.warn(`Error fetching lead, retrying... (${attempt}/${MAX_RETRIES})`, error);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    return fetchAttempt(attempt + 1);
                }
                console.error("Error fetching lead after retries:", error);
                throw error;
            }
        };

        return fetchAttempt();
    },

    /**
     * Update lead fields
     * @param {string} id 
     * @param {object} updates 
     */
    updateLead: async (id, updates) => {
        try {
            const docRef = doc(db, 'leads', id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating lead:", error);
            throw error;
        }
    },

    /**
     * Move lead to a new stage
     * @param {string} id 
     * @param {string} newStageId 
     */
    moveStage: async (id, newStageId) => {
        try {
            const docRef = doc(db, 'leads', id);

            // Fetch lead data for validation
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Lead not found");
            const lead = { id: docSnap.id, ...docSnap.data() };

            // Centralized move validation
            const error = validateMove(lead, newStageId);
            if (error) {
                const err = new Error(error.message);
                err.code = 'WORKFLOW_VALIDATION_FAILED';
                err.stageId = error.stageId;
                throw err;
            }

            await updateDoc(docRef, {
                stage: newStageId,
                stageUpdatedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error moving stage:", error);
            throw error;
        }
    },

    /**
     * Add an activity/note to the lead
     * @param {string} id 
     * @param {object} activity { text, type, user }
     */
    addActivity: async (id, activity) => {
        try {
            const docRef = doc(db, 'leads', id);
            const newActivity = {
                id: Date.now(),
                date: new Date().toLocaleString(), // Store ISO string ideally, but keeping existing format compatibility
                ...activity
            };

            await updateDoc(docRef, {
                activities: arrayUnion(newActivity),
                lastContact: new Date().toLocaleString(), // Update last contact on activity
                updatedAt: serverTimestamp()
            });
            return newActivity;
        } catch (error) {
            console.error("Error adding activity:", error);
            throw error;
        }
    },

    /**
     * Delete a lead permanently
     * @param {string} id 
     */
    deleteLead: async (id) => {
        try {
            await deleteDoc(doc(db, 'leads', id));
            return true;
        } catch (error) {
            console.error("Error deleting lead:", error);
            throw error;
        }
    }
};
