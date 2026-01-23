
// Core Configuration Constants

export const PIPELINE_STAGES = [
    { id: 'new', name: 'New Leads', color: 'bg-blue-500' },
    { id: 'contacted', name: 'Contacted', color: 'bg-premium-gold-500' },
    { id: 'audit', name: 'Audited', color: 'bg-purple-500' },
    { id: 'proposal', name: 'Quote Sent', color: 'bg-orange-500' },
    { id: 'won', name: 'Closed Won', color: 'bg-green-500' },
];

export const SERVICE_TYPES = [
    { id: 'solar', name: 'Solar & Inverter' },
    { id: 'cctv', name: 'CCTV & Security' },
    { id: 'wiring', name: 'Electrical Wiring' },
    { id: 'generator', name: 'Generator / ATS' },
    { id: 'earthing', name: 'Earthing & Surge' },
    { id: 'industrial', name: 'Industrial Safety' }
];

export const PROJECT_PHASES = [
    'Planning',
    'Procurement',
    'Installation',
    'Testing',
    'Handover'
];

// Helper to get today's date in YYYY-MM-DD
export const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

// Helper to filter data by time range
// Used in Dashboards
export const filterByRange = (data, range, referenceDate = getToday()) => {
    if (!data) return [];
    const anchor = new Date(referenceDate);
    return data.filter(item => {
        // Handle Firestore timestamps or date strings robustly
        const itemDate = ensureDate(item.createdAt || item.date || item.created_at);

        // If the date is invalid (ensureDate returns current date as fallback, 
        // but we might want to exclude really bad data if it returns true in original logic)
        // Original logic returned true if no date found. Let's maintain that or improve it.
        if (!item.createdAt && !item.date && !item.created_at) return true;

        if (range === 'day') {
            return itemDate.toDateString() === anchor.toDateString();
        }
        if (range === 'week') {
            const weekStart = new Date(anchor);
            weekStart.setDate(anchor.getDate() - anchor.getDay()); // Sunday start
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return itemDate >= weekStart && itemDate <= weekEnd;
        }
        if (range === 'month') {
            return itemDate.getMonth() === anchor.getMonth() && itemDate.getFullYear() === anchor.getFullYear();
        }
        if (range === 'year') {
            return itemDate.getFullYear() === anchor.getFullYear();
        }
        return true;
    });
};

/**
 * Robustly converts various date formats (ISO string, Firestore Timestamp, or Date object)
 * into a standard Javascript Date object.
 */
export const ensureDate = (dateVal) => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal.toDate === 'function') return dateVal.toDate(); // Firestore Timestamp
    if (typeof dateVal === 'string') {
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date(dateVal) || new Date();
};
