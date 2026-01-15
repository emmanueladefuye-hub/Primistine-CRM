import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectsProvider } from '../contexts/ProjectsContext';
import { LeadsProvider } from '../contexts/LeadsContext';
import { IssuesProvider } from '../contexts/IssuesContext';
import { InvoicesProvider } from '../contexts/InvoicesContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { AuditsProvider } from '../contexts/AuditsContext';
import { ClientsProvider } from '../contexts/ClientsContext';
import { TeamsProvider } from '../contexts/TeamsContext';
import { DeploymentsProvider } from '../contexts/DeploymentsContext';

export default function AppProviders({ children }) {
    return (
        <ClientsProvider>
            <ProjectsProvider>
                <TeamsProvider>
                    <DeploymentsProvider>
                        <InventoryProvider>
                            <IssuesProvider>
                                <InvoicesProvider>
                                    <LeadsProvider>
                                        <AuditsProvider>
                                            {children}
                                        </AuditsProvider>
                                    </LeadsProvider>
                                </InvoicesProvider>
                            </IssuesProvider>
                        </InventoryProvider>
                    </DeploymentsProvider>
                </TeamsProvider>
            </ProjectsProvider>
        </ClientsProvider>
    );
}
