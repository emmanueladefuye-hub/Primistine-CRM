import { useState, useCallback } from 'react';

/**
 * Hook to manage complex workflow validation
 * @param {object} rules - Validation rules object
 * @param {object} data - Current data context
 */
export const useWorkflowEngine = (rules, data) => {
    const [errors, setErrors] = useState({});

    const validateStep = useCallback((stepId) => {
        const stepRules = rules[stepId];
        if (!stepRules) return true;

        const newErrors = {};
        let isValid = true;

        for (const rule of stepRules) {
            if (!rule.condition(data)) {
                isValid = false;
                newErrors[rule.field || 'general'] = rule.message;
                // If critical, stop there? Or continue to collect all errors?
                // Let's collect all
            }
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    }, [rules, data]);

    const clearErrors = () => setErrors({});

    return {
        validateStep,
        errors,
        clearErrors,
        isValid: Object.keys(errors).length === 0
    };
};
