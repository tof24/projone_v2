import React from 'react';
import './StartScreen.css';

const MobileStartScreen = ({ isStart, setIsStart }) => {
    const handleClick = () => {
        console.log("Start button clicked");
        setIsStart(prevIsStart => !prevIsStart);
    };

    return (
        <div className="rotate-screen">
                <div className="mobile-start-screen">
                    <h1 className="title">NEW BALL</h1>
                    <div className="Mcontent">
                        <div className="mobile-column fredoka-regular">

                            <p>Welcome! For the best experience, use your mobile device to interact with the game—move the ball, draw, and more. To view the actions of other players, check out the game on a desktop PC.</p>
                            <button className="start-button fredoka-regular" onClick={handleClick}>Start</button>
                        </div>
                    </div>

                </div>
        </div>
    );
};

export default MobileStartScreen;
