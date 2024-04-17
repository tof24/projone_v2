import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Trace from "./Trace";


const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [velocity, setVelocity] = useState({ x: 20, y: 20 });
    const [acceleration, setAcceleration] = useState({ x: 1, y: 1 });
    const ballSize = 20; // Size of the ball
    const [screenWidth, setscreenWidth] = useState();
    const [screenHeight, setscreenHeight] = useState();
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });

    useEffect(() => {
        const newSocket = io('http://localhost:4000');
        setSocket(newSocket);

        newSocket.on('playerPositions', (data) => {
            setPlayers(data);
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        setscreenWidth(window.innerWidth);
        setscreenHeight(window.innerHeight);




        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y - 1 }));
                    break;
                case 'ArrowDown':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y + 1 }));
                    break;
                case 'ArrowLeft':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x - 1 }));
                    break;
                case 'ArrowRight':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x + 1 }));
                    break;
                default:
                    break;
            }
        };
        const handleDeviceOrientation = (event) => {
            const beta = event.beta; // Angle of tilt in the front-to-back direction (-180 to 180)
            const gamma = event.gamma; // Angle of tilt in the left-to-right direction (-90 to 90)

            // Calculate acceleration based on gyroscope data
            const newAcceleration = {
                x: gamma / 10, // Normalize gamma to the range -1 to 1
                y: beta / 10 // Normalize beta to the range -1 to 1
            };

            setAcceleration(newAcceleration);
        };

        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('keydown', handleKeyDown);


        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Update velocity based on acceleration
            setVelocity(prevVelocity => ({
                x: prevVelocity.x + acceleration.x*0.3,
                y: prevVelocity.y + acceleration.y*0.3
            }));

            // Emit the position of the local player's ball to the server
            if (socket) {
                socket.emit('playerMove', { position: velocity });
            }
        }, 1000 / 60); // Update every 16.67 milliseconds for 60 FPS

        return () => clearInterval(interval);
    }, [acceleration, velocity]); // Update when acceleration or velocity changes

    const handleBoundaryCollision = () => {
        // Check if the ball is crossing the left or right border
        if (velocity.x < 0 || velocity.x + ballSize > screenWidth) {
            setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: -prevAcceleration.x }));
        }

        // Check if the ball is crossing the top or bottom border
        if (velocity.y < 0 || velocity.y + ballSize > screenHeight) {
            setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: -prevAcceleration.y }));
        }
    };

    useEffect(() => {
        handleBoundaryCollision();
    }, [velocity, ballSize, screenWidth, screenHeight]);

    return (
        <>
            {Object.keys(players).map(playerId => (
                <div
                    key={playerId}
                    style={{
                        width: `${ballSize}px`,
                        height: `${ballSize}px`,
                        borderRadius: '50%',
                        backgroundColor: 'darkolivegreen', // Change color for other players' balls
                        position: 'absolute',
                        top: `${players[playerId].y}px`,
                        left: `${players[playerId].x}px`,
                    }}
                ></div>
            ))}
            <Trace position={velocity}></Trace>
            <div
                style={{
                    width: `${ballSize}px`,
                    height: `${ballSize}px`,
                    borderRadius: '50%',
                    backgroundColor: 'red',
                    position: 'absolute',
                    top: `${velocity.y}px`,
                    left: `${velocity.x}px`,
                }}
            ></div>
        </>
    );
};

export default Ball;
