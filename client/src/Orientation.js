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
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                // Handle iOS 13+ devices.
                DeviceMotionEvent.requestPermission()
                    .then((state) => {
                        if (state === 'granted') {
                            window.addEventListener('devicemotion', handleOrientation);
                        } else {
                            console.error('Request to access the orientation was rejected');
                        }
                    })
                    .catch(console.error);
            } else {
                // Handle regular non iOS 13+ devices.
                window.addEventListener('devicemotion', handleOrientation);
            }
        }

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
