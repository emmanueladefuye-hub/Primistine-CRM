import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectsProvider } from '../contexts/ProjectsContext';
import { SalesPipelineProvider } from '../contexts/SalesPipelineContext_v2'; // New consolidated provider
import { IssuesProvider } from '../contexts/IssuesContext';
import { InvoicesProvider } from '../contexts/InvoicesContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { AuditsProvider } from '../contexts/AuditsContext';
import { TeamsProvider } from '../contexts/TeamsContext';
import { DeploymentsProvider } from '../contexts/DeploymentsContext';
import { MessagesProvider } from '../contexts/MessagesContext';

/**
 * FLAT PROVIDER TREE (V2)
 * Consolidates: Leads, Clients, Quotes -> SalesPipelineProvider
 */
export default function AppProviders_v2({ children }) {
    return (
        <SalesPipelineProvider>
            <ProjectsProvider>
                <TeamsProvider>
                    <DeploymentsProvider>
                        <InventoryProvider>
                            <MessagesProvider>
                                <IssuesProvider>
                                    <InvoicesProvider>
                                        <AuditsProvider>
                                            {children}
                                        </AuditsProvider>
                                    </InvoicesProvider>
                                </IssuesProvider>
                            </MessagesProvider>
                        </InventoryProvider>
                    </DeploymentsProvider>
                </TeamsProvider>
            </ProjectsProvider>
        </SalesPipelineProvider>
    );
}
