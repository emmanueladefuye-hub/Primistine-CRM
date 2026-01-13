
import { db } from '../firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    orderBy,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'site_audits';

export const auditService = {
    /**
     * Save a new audit or update an existing one
     * @param {Object} auditData - The complete audit data object
     * @returns {Promise<string>} - The ID of the saved audit
     */
    saveAudit: async (auditData) => {
        try {
            // Use the existing ID if provided, otherwise generate/allow Firestore to generate
            const auditId = auditData.id;

            if (!auditId) {
                throw new Error("Audit ID is missing");
            }

            const auditRef = doc(db, COLLECTION_NAME, auditId);

            // Clean undefined values as Firestore doesn't like them
            const cleanData = JSON.parse(JSON.stringify(auditData));

            await setDoc(auditRef, {
                ...cleanData,
                updatedAt: serverTimestamp(),
                // partial indexable fields for lists
                clientName: cleanData.client?.clientName || 'Unknown Client',
                projectStatus: cleanData.status || 'Draft',
                serviceTypes: cleanData.services || []
            }, { merge: true });

            return auditId;
        } catch (error) {
            console.error("Error saving audit to Firebase:", error);
            throw error;
        }
    },

    /**
     * Fetch all audits
     * @returns {Promise<Array>}
     */
    getAllAudits: async () => {
        try {
            const auditsRef = collection(db, COLLECTION_NAME);
            const q = query(auditsRef, orderBy('updatedAt', 'desc'));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching audits:", error);
            throw error;
        }
    },

    /**
     * Get a specific audit by ID
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    getAuditById: async (id) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting audit:", error);
            throw error;
        }
    },

    /**
     * Check if an audit exists for a specific lead
     * @param {string} leadId
     * @returns {Promise<Object|null>}
     */
    getAuditByLeadId: async (leadId) => {
        try {
            const auditsRef = collection(db, COLLECTION_NAME);
            const q = query(
                auditsRef,
                where('client.leadId', '==', leadId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error checking lead audit:", error);
            return null;
        }
    }
};
