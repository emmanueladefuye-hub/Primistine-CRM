/**
 * Utility to export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download
 */
export const downloadCSV = (data, filename = 'export.csv') => {
    if (!data || !data.length) return;

    // Get headers from first object keys
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const cell = row[header] === null || row[header] === undefined ? '' : row[header];
                // Escape commas and quotes
                const escaped = String(cell).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        )
    ].join('\n');

    // Create blobs and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
