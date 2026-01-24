import { z } from 'zod';

export const LeadSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    company: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    phone: z.string().min(10, "Phone number must be valid").optional().or(z.literal('')),
    address: z.string().optional(),
    value: z.number({ invalid_type_error: "Value must be a number" }).min(0, "Value cannot be negative"),
    stage: z.enum(['new', 'contacted', 'audit', 'proposal', 'won', 'lost']).default('new'),
    source: z.string().optional(),
    attribution: z.object({
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_campaign: z.string().optional(),
        utm_term: z.string().optional(),
        utm_content: z.string().optional(),
        referrer: z.string().optional(),
        ad_id: z.string().optional()
    }).optional(),
    serviceInterest: z.array(z.string()).min(1, "At least one service interest is required"),
    notes: z.string().optional()
}).refine(data => data.email || data.phone, {
    message: "Either Email or Phone is required",
    path: ["email"]
});

export const AuditSchema = z.object({
    leadId: z.string().min(1, "Lead ID is required"),
    engineerId: z.string().min(1, "Engineer ID is required"),
    date: z.string(),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
    checklist: z.array(z.object({
        id: z.string(),
        label: z.string(),
        checked: z.boolean()
    })).optional()
});
