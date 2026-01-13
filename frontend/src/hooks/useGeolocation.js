import { useState, useEffect } from 'react';

export const useGeolocation = (options = {}) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError({ message: "Geolocation not supported" });
            setLoading(false);
            return;
        }

        const handleSuccess = (pos) => {
            const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
            setLocation({
                latitude,
                longitude,
                accuracy,
                altitude,
                heading,
                speed,
                timestamp: pos.timestamp
            });
            setLoading(false);
        };

        const handleError = (err) => {
            setError(err);
            setLoading(false);
        };

        // Get initial position
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

        // Watch position
        const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

        return () => navigator.geolocation.clearWatch(watchId);
    }, [JSON.stringify(options)]);

    return { location, error, loading };
};
