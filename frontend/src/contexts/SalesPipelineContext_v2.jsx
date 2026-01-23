import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { usePaginatedCollection } from '../hooks/usePaginatedCollection';
import { crmService } from '../lib/services/crmService';
import { orderBy, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { PIPELINE_STAGES } from '../lib/constants';

// Import legacy contexts for REAL shim support (pointing to same memory reference)
import { LeadsContext } from './LeadsContext';
import { ClientsContext } from './ClientsContext';
import { QuotesContext } from './QuotesContext';

const SalesPipelineContext = createContext();

export function useSalesPipeline() {
    return useContext(SalesPipelineContext);
}

// Shim hooks for existing code
export const useLeads = () => useContext(LeadsContext);
export const useClients = () => useContext(ClientsContext);
export const useQuotes = () => useContext(QuotesContext);

export function SalesPipelineProvider({ children }) {
    const { currentUser, userProfile } = useAuth();

    // 1. Base Constraints
    // we must limit the 'all leads' query (used for Board) to prevent browser crash on 10k items
    const leadsQuery = useMemo(() => [orderBy('createdAt', 'desc'), limit(100)], []);
    const clientsQuery = useMemo(() => [orderBy('name')], []);
    const quotesQuery = useMemo(() => [orderBy('createdAt', 'desc')], []);

    // 2. Data Fetching Hooks (Must always be top-level)
    const { data: leads, loading: leadsLoading } = useScopedCollection('leads', leadsQuery);
    const {
        data: pagedLeads,
        loading: pagedLoading,
        hasMore: leadsHasMore,
        loadMore: loadMoreLeads
    } = usePaginatedCollection('leads', leadsQuery, 20);

    const { data: quotes, loading: quotesLoading } = useScopedCollection('quotes', quotesQuery);
    const { data: clients, loading: clientsLoading } = useScopedCollection('clients', clientsQuery);

    useEffect(() => {
        if (currentUser) {
            loadMoreLeads(true);
        }
    }, [currentUser]); // Now sensitive to auth state

    // 3. Guards / Loading states (After hooks)
    const loading = leadsLoading || quotesLoading || clientsLoading || pagedLoading;

    if (!currentUser) {
        return (
            <SalesPipelineContext.Provider value={{ loading: false }}>
                <LeadsContext.Provider value={{ loading: false }}>
                    <ClientsContext.Provider value={{ loading: false }}>
                        <QuotesContext.Provider value={{ loading: false }}>
                            {children}
                        </QuotesContext.Provider>
                    </ClientsContext.Provider>
                </LeadsContext.Provider>
            </SalesPipelineContext.Provider>
        );
    }

    // 2. Optimized Actions (Using Service Layer)
    const addLead = useCallback(async (leadData) => {
        try {
            return await crmService.addLead(leadData, userProfile, currentUser);
        } catch (err) {
            toast.error('Failed to add lead');
            throw err;
        }
    }, [currentUser, userProfile]);

    const updateLead = useCallback(async (id, updates) => {
        try {
            return await crmService.updateLead(id, updates, currentUser);
        } catch (err) {
            toast.error('Failed to update lead');
            throw err;
        }
    }, [currentUser]);

    const moveLeadStage = useCallback(async (id, newStage) => {
        const lead = leads?.find(l => l.id === id);
        if (!lead || lead.stage === newStage) return;

        try {
            // Logic for 'won' stage: Convert to Client/Project
            if (newStage === 'won' && lead.stage !== 'won') {
                await crmService.convertLeadToClientAndProject(lead, userProfile, currentUser);
            }

            await crmService.updateLead(id, {
                stage: newStage,
                stageUpdatedAt: new Date().toISOString()
            }, currentUser);

            toast.success(`Lead moved to ${newStage}`);
        } catch (err) {
            console.error('Stage move failed:', err);
            toast.error('Failed to update stage');
        }
    }, [leads, userProfile, currentUser]);

    // 3. Client Management
    const addClient = useCallback(async (clientData) => {
        return await crmService.addClient(clientData, userProfile, currentUser);
    }, [currentUser, userProfile]);

    // 4. Conversion Helpers (Shim for legacy support, utilizing service)
    const createClientFromLead = useCallback(async (lead) => {
        // In V2, we might prefer a single "convert" action, but keeping legacy granular API for now
        // This is a partial implementation of the "won" flow if called manually
        try {
            await crmService.addClient({
                name: lead.name,
                company: lead.company,
                email: lead.email,
                phone: lead.phone,
                leadId: lead.id,
                source: 'Converted Lead',
                status: 'Active'
            }, userProfile, currentUser);
            toast.success("Client created from lead");
        } catch (e) {
            console.error(e);
            toast.error("Failed to create client");
        }
    }, [currentUser, userProfile]);

    const createProjectFromLead = useCallback(async (lead) => {
        try {
            // we could call convertLeadToClientAndProject but that does both.
            // verifying if we have a standalone "create project" in service? No, it's atomic there.
            // We will do a direct addProject via a projects context or just manual service call here for the shim.
            // Ideally we move to using moveLeadStage('won') which triggers the service transaction.

            // For the shim, let's trigger the atomic service if possible, or just warn that it should be done via stage move.
            // Or implement a simple doc add here to satisfy the function signature.
            await crmService.convertLeadToClientAndProject(lead, userProfile, currentUser);
            // toast success handled in service or here
        } catch (e) {
            console.error(e);
            toast.error("Failed to convert lead to project");
        }
    }, [currentUser, userProfile]);

    const value = {
        // State
        leads: leads || [],
        pagedLeads,
        leadsHasMore,
        clients: clients || [],
        quotes: quotes || [],
        loading: loading || pagedLoading,
        pipelineStages: PIPELINE_STAGES,

        // Actions
        addLead,
        updateLead,
        moveLeadStage,
        addClient,
        loadMoreLeads,

        // Conversion Helpers
        createClientFromLead,
        createProjectFromLead,

        // Helpers
        getLeadById: (id) => leads?.find(l => l.id === id),
        getClientById: (id) => clients?.find(c => c.id === id)
    };

    return (
        <SalesPipelineContext.Provider value={value}>
            <LeadsContext.Provider value={value}>
                <ClientsContext.Provider value={value}>
                    <QuotesContext.Provider value={value}>
                        {children}
                    </QuotesContext.Provider>
                </ClientsContext.Provider>
            </LeadsContext.Provider>
        </SalesPipelineContext.Provider>
    );
}
