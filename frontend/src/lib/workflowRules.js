import { auditService } from './services/auditService';

/**
 * Definition of Validation Rules for Lead Workflow
 * Each key is a 'target stage' or 'action'.
 * Rules are evaluated by 'useWorkflowEngine'.
 */
export const LEAD_WORKFLOW_RULES = {
    // Rules to move TO 'audit' stage (Strict: Must have Audit)
    'audit': [
        {
            field: 'contact_info',
            message: 'Lead must have a phone number or email.',
            condition: (lead) => !!lead.phone || !!lead.email
        },
        {
            id: 'audit_required',
            field: 'audit',
            message: 'Audit Required! Move to this stage only after a site audit is completed.',
            condition: (lead) => !!lead.hasAudit
        }
    ],

    // Rules to move TO 'proposal' stage (Strict: Must have Audit)
    'proposal': [
        {
            id: 'audit_required',
            field: 'audit',
            message: 'Cannot send proposal without a confirmed site audit.',
            condition: (lead) => !!lead.hasAudit
        }
    ],

    // Rules to move TO 'won' stage
    'won': [
        {
            field: 'proposal',
            message: 'Cannot close as Won without a Finalized Proposal (Quote)',
            condition: (lead) => !!lead.quoteId || !!lead.proposalId
        }
    ]
};
