import React, { useEffect, useState } from 'react';
import './App.css'; // Import the CSS for styling

const Portrait = () => {
    const [isPortrait, setIsPortrait] = useState(true);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const handleOrientationChange = () => {
            const isPortraitMode = window.matchMedia('(orientation: portrait)').matches;
            setIsPortrait(isPortraitMode);
            setShowWarning(!isPortraitMode);
            console.log("portrait", isPortraitMode, isPortrait);
        };

        // Initial check
        handleOrientationChange();

        // Listen for orientation changes
        window.addEventListener('resize', handleOrientationChange);

        return () => {
            // Clean up listener
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, []);

    const closeModal = () => {
        setShowWarning(false);
    };

    return (
        <div>
            {showWarning && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>Warning</h2>
                        <p>Please rotate your device to portrait mode for the best experience.</p>
                    </div>
                </div>
            )}
            {isPortrait ? (
                <p style={{ color: "white" }}>Device is in portrait mode.</p>
            ) : (
                <p style={{ color: "white" }}>Please rotate your device to portrait mode for the best experience.</p>
            )}
        </div>
    );
};

export default Portrait;
