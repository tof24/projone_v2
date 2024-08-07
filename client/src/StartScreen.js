import React from 'react';
import './StartScreen.css';

const StartScreen = ({ isStart, setIsStart }) => {
    const handleClick = () => {
        console.log("Start button clicked");
        setIsStart(prevIsStart => !prevIsStart);
    };

    return (
        <div className="start-screen">
            <h1 className="title">NEW BALL</h1>
            <div className="content">
                <div className="column ">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" height="24px" viewBox="0 -960 960 960" width="24px" fill="#222222"><path d="M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v720q0 33-23.5 56.5T680-40H280Zm0-120v40h400v-40H280Zm0-80h400v-480H280v480Zm0-560h400v-40H280v40Zm0 0v-40 40Zm0 640v40-40Z"/></svg>
                    <h2 className={"Futura-regular"} >for mobile</h2>
                    <p className={"fredoka-regular"}>For the best experience, use the mobile device to draw and control the ball by tilting, shaking, and twisting it. To view the actions of other players, look at the game on the desktop screen.</p>
                </div>
                <div className="column">
                    <svg xmlns="http://www.w3.org/2000/svg" height="60px" viewBox="0 -960 960 960" width="60px" fill="#222222"><path d="M320-120v-80h80v-80H160q-33 0-56.5-23.5T80-360v-400q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v400q0 33-23.5 56.5T800-280H560v80h80v80H320ZM160-360h640v-400H160v400Zm0 0v-400 400Z"/></svg>
                    <h2 className={"Futura-regular"}>for desktop</h2>
                    <p className={"fredoka-regular"}>This screen is for viewing only and doesn’t include interactive controls on your desktop. To control the game—such as moving the ball and drawing—please use a mobile device. On your mobile, you can interact with the game, while the desktop will display the actions of all players."</p>
                </div>
            </div>
            <button className="start-button Futura-regular" onClick={handleClick}>Let's Begin</button>
        </div>
    );
};

export default StartScreen;
