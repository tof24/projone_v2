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
            <h1 style={{color: "white"}}>Website Content</h1>
            {isPortrait ? (
                <p style={{color: "white"}}>Device is in portrait mode.</p>
            ) : (
                <p style={{color: "white"}}>Please rotate your device to portrait mode for the best experience.</p>
            )}
        </div>
    );
};

export default Portrait;
