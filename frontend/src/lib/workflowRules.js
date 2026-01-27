/**
 * Pipeline Stage Order (Mandatory Sequence)
 */
export const STAGE_ORDER = ['new', 'contacted', 'audit', 'proposal', 'won'];

/**
 * Definition of Validation Rules for Lead Workflow
 */
export const LEAD_WORKFLOW_RULES = {
    // Rules to move TO 'contacted' stage
    'contacted': [
        {
            id: 'activity_required',
            field: 'activities',
            message: 'You must log at least one contact attempt (activity) before moving to "Contacted".',
            condition: (lead) => (lead.activities && lead.activities.length > 0)
        }
    ],

    // Rules to move TO 'audit' stage (Strict: Must have COMPLETED Audit)
    'audit': [
        {
            id: 'contact_info',
            field: 'contact_info',
            message: 'Lead must have a phone number or email.',
            condition: (lead) => !!lead.phone || !!lead.email
        },
        {
            id: 'audit_completed',
            field: 'audit',
            message: 'Cannot move to Audited without a COMPLETED site audit report.',
            condition: (lead) => lead.hasAudit === true && lead.auditStatus === 'Completed'
        }
    ],

    // Rules to move TO 'proposal' stage
    'proposal': [
        {
            id: 'audit_completed_proposal',
            field: 'audit',
            message: 'Cannot move to Proposal without a COMPLETED site audit report.',
            condition: (lead) => lead.hasAudit === true && lead.auditStatus === 'Completed'
        }
    ],

    // Rules to move TO 'won' stage
    'won': [
        {
            id: 'quote_required',
            field: 'proposal',
            message: 'Cannot close as Won without a Finalized Quote.',
            condition: (lead) => !!lead.quoteId || !!lead.proposalId
        }
    ]
};

/**
 * Centralized move validation logic
 * @param {object} lead 
 * @param {string} newStage 
 * @returns {null|object} null if valid, { message, stageId } if invalid
 */
export const validateMove = (lead, newStage) => {
    const targetIdx = STAGE_ORDER.indexOf(newStage);
    const currentIdx = STAGE_ORDER.indexOf(lead.stage || 'new');

    if (targetIdx === -1) return null; // Unknown stage, safety bypass

    // 1. Prevent skipping stages
    if (targetIdx > currentIdx + 1) {
        const nextTarget = STAGE_ORDER[currentIdx + 1];
        return {
            message: `Cannot skip stages. You must first move to "${nextTarget.charAt(0).toUpperCase() + nextTarget.slice(1)}".`,
            stageId: nextTarget
        };
    }

    // 2. Check all rules up to the target stage (inclusive)
    // This handles cases where a previous stage might have became invalid or
    // ensures the target stage requirements are met.
    for (let i = 0; i <= targetIdx; i++) {
        const stageToCheck = STAGE_ORDER[i];
        const stageRules = LEAD_WORKFLOW_RULES[stageToCheck];

        if (stageRules) {
            for (const rule of stageRules) {
                if (!rule.condition(lead)) {
                    return {
                        message: rule.message,
                        stageId: stageToCheck
                    };
                }
            }
        }
    }

    return null; // Valid
};
