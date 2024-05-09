import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Trace from "./Trace";


const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [velocity, setVelocity] = useState({ x: 1, y: 1 });
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
                    setVelocity(prevVelocity => ({ ...prevVelocity, y: prevVelocity.y - 1 }));
                    break;
                case 'ArrowDown':
                    setVelocity(prevVelocity => ({ ...prevVelocity, y: prevVelocity.y + 1 }));
                    break;
                case 'ArrowLeft':
                    setVelocity(prevVelocity => ({ ...prevVelocity, x: prevVelocity.x - 1 }));
                    break;
                case 'ArrowRight':
                    setVelocity(prevVelocity => ({ ...prevVelocity, x: prevVelocity.x + 1 }));
                    break;
                default:
                    break;
            }
        };

        const handleDeviceOrientation = (event) => {
            const beta = event.beta; // Angle of tilt in the front-to-back direction (-180 to 180)
            const gamma = event.gamma; // Angle of tilt in the left-to-right direction (-90 to 90)

            // Calculate velocity based on gyroscope data
            const newVelocity = {
                x: gamma / 5, // Normalize gamma to the range -1 to 1
                y: beta / 5 // Normalize beta to the range -1 to 1
            };

            setVelocity(newVelocity);
        };

        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Update position based on velocity
            setPosition(prevPosition => ({
                x: prevPosition.x + velocity.x * 0.95,
                y: prevPosition.y + velocity.y * 0.95
            }));

            // Emit the position of the local player's ball to the server
            if (socket) {
                socket.emit('playerMove', { position });
            }
        }, 1000 / 60); // Update every 16.67 milliseconds for 60 FPS

        return () => clearInterval(interval);
    }, [velocity]); // Update when velocity changes

    const handleBoundaryCollision = () => {
        // Check if the ball is crossing the left or right border
        if (position.x < 0 || position.x + ballSize > screenWidth) {
            setVelocity(prevVelocity => ({ ...prevVelocity, x: -prevVelocity.x }));
        }

        // Check if the ball is crossing the top or bottom border
        if (position.y < 0 || position.y + ballSize > screenHeight) {
            setVelocity(prevVelocity => ({ ...prevVelocity, y: -prevVelocity.y }));
        }
    };

    useEffect(() => {
        handleBoundaryCollision();
    }, [position, ballSize, screenWidth, screenHeight]);

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
            <Trace position={position}></Trace>
            <div
                style={{
                    width: `${ballSize}px`,
                    height: `${ballSize}px`,
                    borderRadius: '50%',
                    backgroundColor: 'red',
                    position: 'absolute',
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                }}
            ></div>
        </>
    );
};

export default Ball;
