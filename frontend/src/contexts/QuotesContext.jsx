import React, { createContext, useContext, useMemo } from 'react';
import { orderBy } from 'firebase/firestore';
import { useScopedCollection } from '../hooks/useScopedCollection';

export const QuotesContext = createContext();

export function useQuotes() {
    const context = useContext(QuotesContext);
    if (!context) {
        throw new Error('useQuotes must be used within a QuotesProvider');
    }
    return context;
}

export function QuotesProvider({ children }) {
    const quotesQuery = useMemo(() => [orderBy('createdAt', 'desc')], []);
    const { data: quotes, loading, error } = useScopedCollection('quotes', quotesQuery);

    const value = {
        quotes: quotes || [],
        loading,
        error
    };

    return (
        <QuotesContext.Provider value={value}>
            {children}
        </QuotesContext.Provider>
    );
}
