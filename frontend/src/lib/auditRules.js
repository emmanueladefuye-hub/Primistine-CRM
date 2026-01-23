export const AUDIT_VALIDATION_RULES = {
    0: (data, services) => {
        if (!services || services.length === 0) return "Please select at least one service.";
        return true;
    },
    1: (data, services) => {
        const errors = [];
        if (!data.client?.clientName) errors.push("Client Name is required.");
        if (!data.client?.address) errors.push("Site Address is required.");
        if (!data.client?.phone) errors.push("Client Phone is required.");

        if (services.includes('cctv') && !data.site?.riskLevel) {
            errors.push("Please estimate the Risk Level (Security Assessment).");
        }

        if (errors.length > 0) return errors[0]; // Return first error message
        return true;
    },
    2: (data, services) => {
        return true; // Final review usually doesn't have extra validation beyond previous steps
    }
};
