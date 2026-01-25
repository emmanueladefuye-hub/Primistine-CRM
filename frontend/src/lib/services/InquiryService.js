import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc,
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { SystemLogger, LOG_ACTIONS } from './SystemLogger';

export const InquiryService = {
    /**
     * Track a new raw inquiry (pre-lead) from a source (Web, Meta, Google, etc.)
     */
    trackInquiry: async (inquiryData) => {
        try {
            const inquiriesRef = collection(db, 'inquiries');
            const newInquiry = {
                ...inquiryData,
                status: 'raw',
                timestamp: serverTimestamp(),
                attribution: {
                    source: inquiryData.utm_source || 'direct',
                    medium: inquiryData.utm_medium || 'none',
                    campaign: inquiryData.utm_campaign || 'none',
                    term: inquiryData.utm_term || '',
                    content: inquiryData.utm_content || '',
                    referrer: inquiryData.referrer || 'direct'
                }
            };

            const docRef = await addDoc(inquiriesRef, newInquiry);

            await SystemLogger.log(LOG_ACTIONS.LEAD_CREATED, `New Inquiry Tracked: ${inquiryData.email || inquiryData.phone}`, {
                inquiryId: docRef.id,
                source: newInquiry.attribution.source
            });

            return docRef.id;
        } catch (error) {
            console.error("Error tracking inquiry:", error);
            throw error;
        }
    },

    /**
     * Get recent inquiries for the dashboard
     */
    getRecentInquiries: async (count = 20) => {
        try {
            const inquiriesRef = collection(db, 'inquiries');
            const q = query(inquiriesRef, orderBy('timestamp', 'desc'), limit(count));
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching inquiries:", error);
            return [];
        }
    },

    /**
     * Subscribe to live inquiries for the dashboard
     */
    subscribeToInquiries: (callback) => {
        const inquiriesRef = collection(db, 'inquiries');
        const q = query(
            inquiriesRef,
            where('status', '==', 'raw'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const inquiries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert timestamp for UI
                dateString: doc.data().timestamp?.toDate().toLocaleString() || 'Just now'
            }));
            callback(inquiries);
        });
    },

    /**
     * Convert an inquiry to a formal Lead
     */
    promoteToLead: async (inquiryId, leadData, creatorUid = 'system') => {
        try {
            const inquiryRef = doc(db, 'inquiries', inquiryId);
            const leadsRef = collection(db, 'leads');

            // 1. Create the lead with attribution preserved
            const cleanLeadData = {
                name: leadData.name,
                email: leadData.email || '',
                phone: leadData.phone || '',
                address: leadData.address || '',
                company: leadData.company || '',
                serviceInterest: leadData.serviceInterest || [],
                value: 0,
                stage: 'new',
                source: leadData.attribution?.source || 'Marketing Inquiry',
                attribution: leadData.attribution || {},
                convertedFromInquiry: inquiryId,
                createdAt: serverTimestamp(),
                createdBy: creatorUid
            };

            const docRef = await addDoc(leadsRef, cleanLeadData);

            // 2. Update inquiry status
            await updateDoc(inquiryRef, {
                status: 'promoted',
                leadId: docRef.id,
                convertedAt: serverTimestamp()
            });

            await SystemLogger.log(LOG_ACTIONS.LEAD_CREATED, `Promoted inquiry to lead: ${leadData.name}`, {
                inquiryId,
                leadId: docRef.id,
                source: cleanLeadData.source
            });

            return docRef.id;
        } catch (error) {
            console.error("Error promoting inquiry to lead:", error);
            throw error;
        }
    },

    /**
     * Fetch aggregate metrics for the dashboard
     */
    getMetrics: async () => {
        try {
            const inquiriesRef = collection(db, 'inquiries');
            const projectsRef = collection(db, 'projects');

            // 1. Get total inquiries
            const inquiriesSnap = await getDocs(inquiriesRef);
            const total = inquiriesSnap.size;

            // 2. Get promoted inquiries
            const promotedQ = query(inquiriesRef, where('status', '==', 'promoted'));
            const promotedSnap = await getDocs(promotedQ);
            const convertedCount = promotedSnap.size;

            // 3. Get total ROI from completed projects that came from inquiries
            const projectsQ = query(projectsRef, where('status', '==', 'Active')); // Simplified for now
            const projectsSnap = await getDocs(projectsQ);

            let totalROI = 0;
            projectsSnap.forEach(doc => {
                const data = doc.data();
                if (data.attribution?.source) {
                    totalROI += (data.systemSpecs?.value || 0);
                }
            });

            return {
                totalInquiries: total,
                conversions: convertedCount,
                roi: totalROI,
                rate: total > 0 ? ((convertedCount / total) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error("Error fetching acquisition metrics:", error);
            return { totalInquiries: 0, conversions: 0, roi: 0, rate: 0 };
        }
    },

    /**
     * Delete a single inquiry by ID
     */
    deleteInquiry: async (inquiryId) => {
        try {
            const { deleteDoc } = await import('firebase/firestore');
            const inquiryRef = doc(db, 'inquiries', inquiryId);
            await deleteDoc(inquiryRef);

            await SystemLogger.log(LOG_ACTIONS.SYSTEM_ACTION, `Deleted inquiry: ${inquiryId}`, {
                inquiryId
            });

            return true;
        } catch (error) {
            console.error("Error deleting inquiry:", error);
            throw error;
        }
    }
};
