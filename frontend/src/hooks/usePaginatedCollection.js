import { useState, useCallback, useRef } from 'react';
import {
    collection,
    query,
    getDocs,
    limit,
    startAfter
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook for cursor-based pagination (Non-realtime)
 * Better for large lists where onSnapshot is too expensive.
 */
export function usePaginatedCollection(collectionName, constraints = [], pageSize = 20) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const lastDocRef = useRef(null);

    const loadMore = useCallback(async (isInitial = false) => {
        if (loading || (!hasMore && !isInitial)) return;

        setLoading(true);
        try {
            let q = query(
                collection(db, collectionName),
                ...constraints,
                limit(pageSize)
            );

            if (!isInitial && lastDocRef.current) {
                q = query(q, startAfter(lastDocRef.current));
            }

            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (isInitial) {
                setData(items);
            } else {
                setData(prev => [...prev, ...items]);
            }

            setHasMore(items.length === pageSize);
            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            setError(null);
        } catch (err) {
            console.error(`Error loading paginated ${collectionName}:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [collectionName, JSON.stringify(constraints), pageSize]);

    return { data, loading, error, hasMore, loadMore };
}
