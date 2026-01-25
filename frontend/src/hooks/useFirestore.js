import { useState, useEffect } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook to subscribe to a Firestore collection with optional constraints
 * @param {string} collectionName - Name of the collection
 * @param {Array} constraints - Array of constraints (where, orderBy, limit) - optional
 * @returns {object} { data, loading, error }
 */
export function useCollection(collectionName, _constraints = []) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // We filter null/undefined constraints to prevent Firestore internal assertion errors
    const validConstraints = _constraints.filter(c => !!c);

    // Create a stable key for the useEffect dependency
    // Stringifying only the cleaned constraints ensures the hook only re-runs when actual filters change.
    const queryKey = JSON.stringify(validConstraints);

    useEffect(() => {
        if (!collectionName) {
            setLoading(false);
            return;
        }

        setLoading(true);
        let q = collection(db, collectionName);

        if (validConstraints.length > 0) {
            try {
                q = query(q, ...validConstraints);
            } catch (err) {
                console.error("Invalid Firestore query constraints:", err);
                setError("Query composition failed");
                setLoading(false);
                return;
            }
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const results = [];
                snapshot.forEach(doc => {
                    results.push({ ...doc.data(), id: doc.id });
                });
                setData(results);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(`Error fetching collection ${collectionName}:`, err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, queryKey]);

    return { data, loading, error };
}

/**
 * Hook to subscribe to a single Firestore document
 * @param {string} collectionName 
 * @param {string} docId 
 * @returns {object} { data, loading, error }
 */
export function useDocument(collectionName, docId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, collectionName, docId);

        const unsubscribe = onSnapshot(docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setData({ ...docSnap.data(), id: docSnap.id });
                    setError(null);
                } else {
                    setData(null);
                    setError('Document not found');
                }
                setLoading(false);
            },
            (err) => {
                console.error(`Error fetching document ${collectionName}/${docId}:`, err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, docId]);

    return { data, loading, error };
}
