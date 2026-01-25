/**
 * WorkflowService.js
 * Handles retrieval and processing of n8n workflow definitions.
 */

// Mock data based on the workflows found in the n8n/workflows directory
const WORKFLOWS_METADATA = [
    {
        id: 'workflow_01_lead_capture',
        name: 'Lead Capture',
        description: 'Captures inquiries from the website and saves them to Firestore.',
        nodes: ['Webhook', 'Google Cloud Firestore', 'Discord'],
        category: 'Sales',
        status: 'active'
    },
    {
        id: 'workflow_02_lead_notification',
        name: 'Lead Notification',
        description: 'Sends WhatsApp/Email notifications when a new lead is captured.',
        nodes: ['Firestore Trigger', 'WhatsApp', 'Gmail'],
        category: 'Sales',
        status: 'active'
    },
    {
        id: 'workflow_03_audit_report',
        name: 'Audit Report Generator',
        description: 'Generates PDF reports from site audit data using AI summarizing.',
        nodes: ['Firestore Trigger', 'OpenAI', 'PDF Generator', 'Cloud Storage'],
        category: 'Operations',
        status: 'inactive'
    },
    {
        id: 'workflow_04_low_stock_alert',
        name: 'Low Stock Alert',
        description: 'Monitors inventory levels and alerts the procurement team.',
        nodes: ['Firestore Trigger', 'Condition', 'Slack'],
        category: 'Inventory',
        status: 'active'
    },
    {
        id: 'workflow_05_payment_reminder',
        name: 'Payment Reminder',
        description: 'Sends automated payment reminders based on invoice due dates.',
        nodes: ['Cron', 'Firestore Query', 'Email'],
        category: 'Finance',
        status: 'active'
    },
    {
        id: 'workflow_06_daily_digest',
        name: 'Daily Executive Digest',
        description: 'Compiles a daily summary of conversions and ROI for management.',
        nodes: ['Cron', 'Firestore Aggregate', 'Email'],
        category: 'Executive',
        status: 'active'
    },
    {
        id: 'workflow_07_smart_followup',
        name: 'Smart Follow-up',
        description: 'AI-driven follow-up messages for cold leads.',
        nodes: ['Firestore Trigger', 'OpenAI', 'WhatsApp'],
        category: 'Sales',
        status: 'inactive'
    },
    {
        id: 'workflow_08_outreach',
        name: 'Outreach Automation',
        description: 'Handles outgoing cold emails and tracking.',
        nodes: ['Email Reader', 'CRM Update', 'Gmail'],
        category: 'Marketing',
        status: 'active'
    },
    {
        id: 'workflow_09_weather_monitor',
        name: 'Weather Monitor',
        description: 'Alerts field engineers about adverse weather conditions.',
        nodes: ['Weather API', 'Firestore User Query', 'Push Notification'],
        category: 'Operations',
        status: 'active'
    },
    {
        id: 'workflow_10_voice_punchlist',
        name: 'Voice Punchlist',
        description: 'Converts field voice notes into project punchlist items.',
        nodes: ['Webhook', 'Whisper AI', 'Firestore Update'],
        category: 'Operations',
        status: 'inactive'
    },
    {
        id: 'workflow_11_daily_standup',
        name: 'Daily Standup Bot',
        description: 'Collects daily updates from the team via WhatsApp.',
        nodes: ['Cron', 'WhatsApp', 'Firestore Store'],
        category: 'Team',
        status: 'active'
    },
    {
        id: 'workflow_12_policy_bot',
        name: 'Internal Policy Bot',
        description: 'RAG-based bot to answer team questions about company policy.',
        nodes: ['Webhook', 'OpenAI Embeddings', 'Vector DB', 'WhatsApp'],
        category: 'Support',
        status: 'active'
    }
];

export const WorkflowService = {
    getWorkflows: async () => {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => resolve(WORKFLOWS_METADATA), 300);
        });
    },

    getWorkflowById: async (id) => {
        return new Promise((resolve) => {
            const workflow = WORKFLOWS_METADATA.find(w => w.id === id);
            setTimeout(() => resolve(workflow), 100);
        });
    }
};
