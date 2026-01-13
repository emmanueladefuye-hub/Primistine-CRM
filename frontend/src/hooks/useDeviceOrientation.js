import { useState, useEffect } from 'react';

export const useDeviceOrientation = () => {
    const [orientation, setOrientation] = useState({
        alpha: null, // rotation around z-axis (compass)
        beta: null,  // rotation around x-axis (tilt front-to-back)
        gamma: null, // rotation around y-axis (tilt left-to-right)
        absolute: false
    });
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    const [isPermissionsRequired, setIsPermissionsRequired] = useState(
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
    );

    const handleOrientation = (event) => {
        // iOS provides webkitCompassHeading for true magnetic north
        let heading = event.alpha;
        if (event.webkitCompassHeading) {
            heading = event.webkitCompassHeading;
        } else if (event.absolute === false && event.alpha !== null) {
            // If not absolute, alpha might be relative to start
            heading = event.alpha;
        }

        setOrientation({
            alpha: heading,
            beta: event.beta,
            gamma: event.gamma,
            absolute: event.absolute || !!event.webkitCompassHeading
        });
    };

    const requestPermission = async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    setIsPermissionsRequired(false);
                    return true;
                } else {
                    setError({ message: "Permission denied for Device Orientation" });
                    return false;
                }
            } catch (err) {
                setError(err);
                return false;
            }
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
            return true;
        }
    };

    useEffect(() => {
        if (!window.DeviceOrientationEvent) {
            setError({ message: "Device Orientation not supported" });
            return;
        }

        setIsSupported(true);

        // For non-iOS or already granted
        if (!isPermissionsRequired) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [isPermissionsRequired]);

    return { orientation, error, isSupported, requestPermission, isPermissionsRequired };
};
