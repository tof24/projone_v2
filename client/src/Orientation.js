import React, { useState, useEffect } from 'react';

const Orientation = () => {
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });

    useEffect(() => {
        const handleOrientation = event => {
            setOrientation({
                alpha: event.alpha,
                beta: event.beta,
                gamma: event.gamma
            });
        };

        window.addEventListener('deviceorientation', handleOrientation, true);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, []); // Empty array as dependency to run only once on component mount

    return (
        <div>
            <h2>Gyroscope Data:</h2>
            <p>Alpha: {orientation.alpha}</p>
            <p>Beta: {orientation.beta}</p>
            <p>Gamma: {orientation.gamma}</p>
        </div>
    );
};

export default Orientation;
