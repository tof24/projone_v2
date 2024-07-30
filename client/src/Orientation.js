import React, { useState, useEffect } from 'react';

const Orientation = () => {
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        const handleOrientation = event => {
            setOrientation({
                alpha: event.alpha,
                beta: event.beta,
                gamma: event.gamma
            });
        };

        const requestPermission = async () => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    if (response === 'granted') {
                        setPermissionGranted(true);
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    } else {
                        console.warn('Permission to access device orientation was denied.');
                    }
                } catch (error) {
                    console.error('Error requesting device orientation permission:', error);
                }
            } else {
                // If permission request API is not available, assume permissions are granted (pre-iOS 13)
                setPermissionGranted(true);
                window.addEventListener('deviceorientation', handleOrientation, true);
            }
        };

        requestPermission();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, []); // Empty array as dependency to run only once on component mount

    return (
        <div>
            <h2>Gyroscope Data:</h2>
            {permissionGranted ? (
                <>
                    <p>Alpha: {orientation.alpha}</p>
                    <p>Beta: {orientation.beta}</p>
                    <p>Gamma: {orientation.gamma}</p>
                </>
            ) : (
                <p>Permission to access device orientation was not granted.</p>
            )}
        </div>
    );
};

export default Orientation;
