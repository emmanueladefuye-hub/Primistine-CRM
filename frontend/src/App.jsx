import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AppProviders from './components/AppProviders';

// Pages
import LoginPage from './pages/LoginPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import SalesDashboard from './pages/SalesDashboard';
import LeadDetailPage from './pages/LeadDetailPage';
import ProjectsDashboard from './pages/ProjectsDashboard';
import ProjectDetail from './pages/ProjectDetail';
import FinanceDashboard from './pages/FinanceDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AuditWizard from './pages/AuditWizard';
import AuditsList from './pages/AuditsList';
import AuditDetail from './pages/AuditDetail';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import Error404 from './pages/Error404';
import QuoteBuilder from './pages/QuoteBuilder';
import ClientsList from './pages/ClientsList';
import InventoryDashboard from './pages/InventoryDashboard';
import TeamsList from './pages/TeamsList';
import TeamCalendar from './pages/TeamCalendar';
import OperationalIssues from './pages/OperationalIssues';
import CommunicationsHub from './pages/CommunicationsHub';
import ClientProfile from './pages/ClientProfile';

function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/executive" replace />} />

          {/* Executive / Finance - Restricted to Admin/Finance/Manager? */}
          <Route element={<ProtectedRoute requiredPermission={{ resource: 'financials', action: 'view' }} />}>
            <Route path="/executive" element={<ExecutiveDashboard />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/finance" element={<FinanceDashboard />} />
          </Route>

          {/* Pipeline - Restricted to Sales/Admin/Manager */}
          <Route element={<ProtectedRoute requiredPermission={{ resource: 'leads', action: 'view' }} />}>
            <Route path="/sales" element={<SalesDashboard />} />
            <Route path="/sales/leads/:id" element={<LeadDetailPage />} />
            <Route path="/sales/quotes/new" element={<QuoteBuilder />} />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
            <Route path="/inbox" element={<CommunicationsHub />} />
          </Route>

          {/* Audits - Dedicated permission */}
          <Route element={<ProtectedRoute requiredPermission={{ resource: 'audits', action: 'view' }} />}>
            <Route path="/audits" element={<AuditsList />} />
            <Route path="/audits/new" element={<AuditWizard />} />
            <Route path="/audits/:id" element={<AuditDetail />} />
          </Route>

          {/* Operations/Projects - Engineers/Managers */}
          <Route element={<ProtectedRoute requiredPermission={{ resource: 'projects', action: 'view' }} />}>
            <Route path="/projects" element={<ProjectsDashboard />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/operations/issues" element={<OperationalIssues />} />
          </Route>

          {/* Inventory */}
          <Route element={<ProtectedRoute requiredPermission={{ resource: 'inventory', action: 'view' }} />}>
            <Route path="/inventory" element={<InventoryDashboard />} />
          </Route>

          {/* Teams / Calendar - Generally open but checked */}
          <Route element={<ProtectedRoute requiredPermission={{ resource: 'users', action: 'view' }} />}>
            <Route path="/teams" element={<TeamsList />} />
            <Route path="/teams/calendar" element={<TeamCalendar />} />
          </Route>

          {/* System - Open to all logged in, internal protections apply */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>

        <Route path="*" element={<Error404 />} />
      </Routes>
    </AppProviders>
  );
}

export default App;
