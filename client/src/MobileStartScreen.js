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
                        <div className="mobile-column">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#A7B2AD"><path d="M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v720q0 33-23.5 56.5T680-40H280Zm0-120v40h400v-40H280Zm0-80h400v-480H280v480Zm0-560h400v-40H280v40Zm0 0v-40 40Zm0 640v40-40Z"/></svg>
                            <h2>for mobile</h2>
                            <p>description from the game description from the game description from the game...description from the game description from the game description from the game...</p>
                            <button className="start-button" onClick={handleClick}>Start</button>
                        </div>
                    </div>

                </div>
        </div>
    );
};

export default MobileStartScreen;
