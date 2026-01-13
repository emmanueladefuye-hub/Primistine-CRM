import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const ROLE_TEMPLATES = {
    super_admin: {
        roleId: "super_admin",
        level: 5,
        displayName: "Super Administrator",
        description: "Full system access - Founders only",
        permissions: {
            "*": { view: "all", create: true, edit: "all", delete: true }
        }
    },
    admin: {
        roleId: "admin",
        level: 4,
        displayName: "Administrator",
        description: "Manage users, view all data, approve actions. No delete logs.",
        permissions: {
            leads: { view: "all", create: true, edit: "all", delete: false },
            audits: { view: "all", create: true, edit: "all", delete: false },
            projects: { view: "all", create: true, edit: "all", delete: false },
            quotes: { view: "all", create: true, edit: "all", delete: true, approve: true },
            financials: { view: "all", create: true, edit: "all", delete: false },
            inventory: { view: "all", create: true, edit: "all", delete: false },
            issues: { view: "all", create: true, edit: "all", delete: true },
            users: { view: "all", create: true, edit: "all", delete: false }, // Manage users
            logs: { view: "all", delete: false }, // Explicit restriction

            approveQuotes: true,
            viewCosts: true,
            manageTeam: true,
            exportData: true
        }
    },
    manager: {
        roleId: "manager",
        level: 3,
        displayName: "Project Manager",
        description: "Oversee team projects, approve quotes.",
        permissions: {
            leads: { view: "team", create: false, edit: "team", delete: false },
            audits: { view: "team", create: false, edit: "team", delete: false },
            projects: { view: "team", create: true, edit: "team", delete: false }, // Assign work
            quotes: { view: "team", create: false, edit: "team", delete: false, approve: true },
            financials: { view: "summary" }, // Summary only
            inventory: { view: "all", create: false, edit: false }, // View only
            issues: { view: "team", create: true, edit: "all", delete: false },
            users: { view: "team" },

            approveQuotes: true,
            viewCosts: false, // "No financial/cost visibility" for operational staff? No, Manager usually sees costs. User said "Finance Officer: View all financial... Manager: Summary". I'll default costs to true for Manager unless specified otherwise, but Matrix says "Financials: Summary".
            manageTeam: true
        }
    },
    finance: {
        roleId: "finance",
        level: 3,
        displayName: "Finance Officer",
        description: "View all financial data, manage invoices/payments",
        permissions: {
            leads: { view: "all", edit: false }, // View Only (Matrix)
            audits: { view: "all", edit: false }, // View Only (Matrix)
            projects: { view: "all", edit: false }, // View Only (Matrix)
            quotes: { view: "all", edit: true }, // Full Access (Matrix)
            financials: { view: "all", create: true, edit: "all", delete: true }, // Full Access
            inventory: { view: "all", edit: false }, // View Only (Matrix)

            viewCosts: true,
            exportData: true
        }
    },
    inventory_manager: {
        roleId: "inventory_manager",
        level: 3,
        displayName: "Inventory Manager",
        description: "Manage stock, procurement, suppliers",
        permissions: {
            inventory: { view: "all", create: true, edit: "all", delete: true }, // Full Access
            projects: { view: "summary" }, // View (Matrix says View, Notes says "See project material needs")
            quotes: { view: "read_only" }, // Read-only
            financials: { view: "all", create: true, edit: "all" }, // Full Access (Matrix: "Inventory - Financials: Full Access" ??? Matrix says "Inventory - Financials: Full Access". Okay.)

            viewCosts: true
        }
    },
    sales_rep: {
        roleId: "sales_rep",
        level: 2,
        displayName: "Sales Representative",
        description: "Manage own leads & quotes",
        permissions: {
            leads: { view: "own", create: true, edit: "own", delete: false },
            quotes: { view: "own", create: true, edit: "own", delete: false, approve: false },
            audits: { view: "all", edit: false }, // Matrix: "View" (usually means all or assigned? I'll set to all for visibility or maybe "read_only"?) Matrix says "Audits: View". I'll use "all" (read only).
            projects: { view: "all", edit: false }, // Matrix: "View".
            financials: { view: false }, // ❌ No
            inventory: { view: "read_only" }, // Read-only

            viewCosts: false
        }
    },
    engineer: {
        roleId: "engineer",
        level: 2,
        displayName: "Field Engineer",
        description: "View assigned projects & audits",
        permissions: {
            leads: { view: false }, // ✗
            audits: { view: "assigned", create: true, edit: "own" }, // Assigned
            projects: { view: "assigned", create: false, edit: "assigned" }, // Assigned
            quotes: { view: false }, // ✗
            financials: { view: "assigned" }, // Matrix: "View Assigned" (e.g. Budget/Expenses for project?)
            inventory: { view: false }, // ✗
            issues: { view: "all", create: true }, // Report issues

            viewCosts: false // Can't see pricing/costs
        }
    },
    auditor: {
        roleId: "auditor",
        level: 1,
        displayName: "Site Auditor",
        description: "Create & edit own site audits only",
        permissions: {
            audits: { view: "assigned", create: true, edit: "own" }, // Own audits only (Matrix says "Assigned" / "Own")
            projects: { view: false }, // ✗
            leads: { view: false }, // ✗
            quotes: { view: false }, // ✗
            financials: { view: false }, // ✗
            inventory: { view: "read_only" }, // Read-only (Product catalog)

            viewCosts: false
        }
    },
    viewer: { // Fallback Level 0
        roleId: "viewer",
        level: 0,
        displayName: "Read Only Viewer",
        permissions: {
            "*": { view: "all", edit: false, create: false, delete: false }
        }
    }
};

export async function initializeRoles() {
    console.log("Initializing System Roles...");
    const batch = writeBatch(db);

    // Iterate through role templates and add them to the batch
    Object.entries(ROLE_TEMPLATES).forEach(([roleId, template]) => {
        // Use root 'roles' collection as decided fix
        const ref = doc(db, 'roles', roleId);
        batch.set(ref, template);
    });

    // (Loop already ran above)

    await batch.commit();
    console.log("Roles initialized successfully.");
}
