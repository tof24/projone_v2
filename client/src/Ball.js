import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Trace from "./Trace";

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 }); // Initial acceleration is 0
    const ballSize = 20; // Size of the ball
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [screenHeight, setScreenHeight] = useState(window.innerHeight);

    useEffect(() => {
        const newSocket = io('wss://achieved-safe-scourge.glitch.me/');
        setSocket(newSocket);

        newSocket.on('playerPositions', (data) => {
            setPlayers(data);
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        const updateScreenDimensions = () => {
            setScreenWidth(window.innerWidth);
            setScreenHeight(window.innerHeight);
        };

        window.addEventListener('resize', updateScreenDimensions);

        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y - 0.1 }));
                    break;
                case 'ArrowDown':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y + 0.1 }));
                    break;
                case 'ArrowLeft':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x - 0.1 }));
                    break;
                case 'ArrowRight':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x + 0.1 }));
                    break;
                default:
                    break;
            }
        };

        const handleDeviceOrientation = (event) => {
            const beta = event.beta; // Angle of tilt in the front-to-back direction (-180 to 180)
            const gamma = event.gamma; // Angle of tilt in the left-to-right direction (-90 to 90)

            const sensitivity = 0.01; // Adjust this value to change sensitivity

            let adjustedX = gamma * sensitivity;
            let adjustedY = beta * sensitivity;

            if (window.innerWidth > window.innerHeight) {
                // Landscape mode
                [adjustedX, adjustedY] = [adjustedY, -adjustedX];
            }

            setAcceleration({
                x: adjustedX,
                y: adjustedY
            });
        };

        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', updateScreenDimensions);
        };
    }, []);

    const maxVelocity = 10; // Set your desired maximum velocity

    useEffect(() => {
        const interval = setInterval(() => {
            let newVelocity = {
                x: velocity.x + acceleration.x,
                y: velocity.y + acceleration.y
            };

            newVelocity.x = Math.min(Math.max(newVelocity.x, -maxVelocity), maxVelocity);
            newVelocity.y = Math.min(Math.max(newVelocity.y, -maxVelocity), maxVelocity);

            setVelocity(newVelocity);

            setPosition(prevPosition => ({
                x: prevPosition.x + newVelocity.x * 0.95,
                y: prevPosition.y + newVelocity.y * 0.95
            }));

            if (socket) {
                socket.emit('playerMove', { position: { x: position.x / screenWidth, y: position.y / screenHeight } });
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [acceleration, velocity, socket, screenWidth, screenHeight]);

    const handleBoundaryCollision = () => {
        if (position.x < 0 || position.x + ballSize > screenWidth) {
            setVelocity(prevVelocity => ({ ...prevVelocity, x: -prevVelocity.x }));
        }

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
                        backgroundColor: 'darkolivegreen',
                        position: 'absolute',
                        top: `${players[playerId].y * screenHeight}px`,
                        left: `${players[playerId].x * screenWidth}px`,
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