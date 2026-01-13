import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    getDocs,
    getDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// --- Generic Helpers ---

export const getCollection = async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDocument = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error(`${collectionName} document ${id} not found`);
    }
};

export const addDocument = async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
};

export const updateDocument = async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
    return { id, ...data };
};

export const deleteDocument = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
    return id;
};

// --- Specific Service Methods (can be expanded) ---

// Projects
export const getProjects = () => getCollection('projects');
export const getProject = (id) => getDocument('projects', id);
export const createProject = (data) => addDocument('projects', data);
export const updateProject = (id, data) => updateDocument('projects', id, data);

// Leads
export const getLeads = () => getCollection('leads');
export const createLead = (data) => addDocument('leads', data);
export const updateLead = (id, data) => updateDocument('leads', id, data);

// Quotes
export const createQuote = (data) => addDocument('quotes', data);
export const getQuotes = () => getCollection('quotes');

// Work Orders
export const getProjectWorkOrders = async (projectId) => {
    const q = query(collection(db, 'work_orders'), where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ... add others as needed
