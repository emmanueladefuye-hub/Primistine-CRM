import { LayoutDashboard, Users, FileText, Briefcase, ShoppingCart, DollarSign, BarChart3, Settings, HelpCircle, MessageSquare, Calendar, AlertCircle, Activity, Globe, Zap } from "lucide-react";

export const NAV_LINKS = [
    {
        category: "Overview",
        items: [
            { name: "Executive", icon: LayoutDashboard, path: "/executive", permission: { resource: 'financials', action: 'view' } },
        ]
    },
    {
        category: "Lead Acquisition",
        items: [
            { name: "Acquisition DB", icon: Activity, path: "/acquisition", permission: { resource: 'leads', action: 'view' } },
            { name: "Landing Page", icon: Globe, path: "/inquiry" },
        ]
    },
    {
        category: "Pipeline",
        items: [
            { name: "Sales & Leads", icon: Users, path: "/sales", permission: { resource: 'leads', action: 'view' } },
            { name: "Site Audits", icon: FileText, path: "/audits", permission: { resource: 'audits', action: 'view' } },
        ]
    },
    {
        category: "Operations",
        items: [
            { name: "Projects", icon: Briefcase, path: "/projects", permission: { resource: 'projects', action: 'view' } },
            { name: "Service Issues", icon: AlertCircle, path: "/operations/issues", permission: { resource: 'issues', action: 'view' } },
        ]
    },
    {
        category: "Resources",
        items: [
            { name: "Clients DB", icon: Users, path: "/clients", permission: { resource: 'leads', action: 'view' } },
            { name: "Inventory", icon: ShoppingCart, path: "/inventory", permission: { resource: 'inventory', action: 'view' } },
            { name: "Team", icon: Users, path: "/teams", permission: { resource: 'users', action: 'view' } },
            { name: "Calendar", icon: Calendar, path: "/teams/calendar", permission: { resource: 'calendar', action: 'view' } },
        ]
    },
    {
        category: "Finance",
        items: [
            { name: "Financial Overview", icon: DollarSign, path: "/finance", permission: { resource: 'financials', action: 'view' } },
            { name: "Communications", icon: MessageSquare, path: "/inbox", permission: { resource: 'leads', action: 'view' } },
        ]
    },
    {
        category: "AI & Automation",
        items: [
            { name: "AI Workflows", icon: Zap, path: "/ai-workflows", permission: { resource: 'system', action: 'manage' } },
            { name: "Automation Logs", icon: Activity, path: "/logs", permission: { resource: 'system', action: 'manage' } },
        ]
    },
    {
        category: "System",
        items: [
            { name: "Settings", icon: Settings, path: "/settings" },
            { name: "Support", icon: HelpCircle, path: "/support" },
        ]
    }
];
