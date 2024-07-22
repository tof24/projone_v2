import React from 'react';

const StartScreen = ({ isStart, setIsStart }) => {
    const handleClick = () => {
        console.log("asdasdasdasdasdasdad")
        setIsStart(prevIsStart => !prevIsStart); // Toggle the state
    };

    return (
        <div>

            <p style={{ color: 'white' }}>TEST START</p>
        </div>
    );
};

export default StartScreen;