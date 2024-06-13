import React, { useEffect, useState } from 'react';

const Portrait = () => {
    const [isPortrait, setIsPortrait] = useState(true);

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsPortrait(window.matchMedia('(orientation: portrait)').matches);
        };

        // Initial check
        handleOrientationChange();

        // Listen for orientation changes
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            // Clean up listener
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    return (
        <div>
            <h1>Website Content</h1>
            {isPortrait ? (
                <p>Device is in portrait mode.</p>
            ) : (
                <p>Please rotate your device to portrait mode for the best experience.</p>
            )}
        </div>
    );
};

export default Portrait;
