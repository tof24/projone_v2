import React, { useCallback, useEffect, useState } from 'react';

const Orientation = () => {
    const [orientation, setOrientation] = useState({ alpha: null, beta: null, gamma: null });
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const onDeviceOrientation = (event) => {
        setOrientation({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
        });
    };

    const requestAccess = useCallback(async () => {
        if (!window.DeviceOrientationEvent) {
            setError(new Error('Device orientation event is not supported by your browser'));
            return false;
        }

        if (window.DeviceOrientationEvent.requestPermission && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            let permission;
            try {
                permission = await window.DeviceOrientationEvent.requestPermission();
            } catch (err) {
                setError(err);
                return false;
            }
            if (permission !== 'granted') {
                setError(new Error('Request to access the device orientation was rejected'));
                return false;
            }
        }

        window.addEventListener('deviceorientation', onDeviceOrientation, true);
        setPermissionGranted(true);
        return true;
    }, []);

    const revokeAccess = useCallback(async () => {
        window.removeEventListener('deviceorientation', onDeviceOrientation, true);
        setOrientation({ alpha: null, beta: null, gamma: null });
        setPermissionGranted(false);
    }, []);

    useEffect(() => {
        return () => {
            revokeAccess();
        };
    }, [revokeAccess]);

    return (
        <div>
            <h2>Gyroscope Data:</h2>
            {error ? (
                <p>Error: {error.message}</p>
            ) : permissionGranted ? (
                <>
                    <p>Alpha: {orientation.alpha !== null ? orientation.alpha : 'N/A'}</p>
                    <p>Beta: {orientation.beta !== null ? orientation.beta : 'N/A'}</p>
                    <p>Gamma: {orientation.gamma !== null ? orientation.gamma : 'N/A'}</p>
                </>
            ) : (
                <p>Permission to access device orientation has not been granted.</p>
            )}
            <div>
                <button onClick={requestAccess} disabled={permissionGranted}>
                    Request Access
                </button>
                <button onClick={revokeAccess} disabled={!permissionGranted}>
                    Revoke Access
                </button>
            </div>
        </div>
    );
};

export default Orientation;
