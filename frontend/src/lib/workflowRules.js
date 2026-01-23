import { auditService } from './services/auditService';

/**
 * Definition of Validation Rules for Lead Workflow
 * Each key is a 'target stage' or 'action'.
 * Rules are evaluated by 'useWorkflowEngine'.
 */
export const LEAD_WORKFLOW_RULES = {
    // Rules to move TO 'audit' stage (usually allowed, but maybe we want to check for contact info)
    'audit': [
        {
            field: 'contact_info',
            message: 'Lead must have a phone number or email before scheduling an audit.',
            condition: (lead) => !!lead.phone || !!lead.email
        }
    ],

    // Rules to move TO 'proposal' stage (Strict: Must have Audit)
    'proposal': [
        {
            id: 'audit_required',
            field: 'audit',
            message: 'Audit Required! Please complete a Site Audit before creating a proposal.',
            // Async check support would be ideal, but for now we assume data is loaded or check synchronous flags
            // In LeadDetailPage_v2, we check duplicate audits.
            // For now, simpler condition:
            condition: (lead) => {
                // Check if we have an audit flag or we just count on the Async check in the component?
                // Ideally, the rule engine should handle async, but our simple hook is sync.
                // We will rely on data.hasAudit being populated by the component for now.
                return !!lead.hasAudit;
            }
        }
    ],

    // Rules to move TO 'won' stage
    'won': [
        {
            field: 'proposal',
            message: 'Cannot close as Won without a Proposal',
            condition: (lead) => !!lead.proposalId || !!lead.value // simplistic check
        }
    ]
};
