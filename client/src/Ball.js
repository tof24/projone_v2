import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Trace from "./Trace";

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
    const ballSize = 20;
    const aspectRatio = 16 / 9; // Aspect ratio of the game board

    useEffect(() => {
        const newSocket = io('wss://achieved-safe-scourge.glitch.me/');
        setSocket(newSocket);

        newSocket.on('playerPositions', (data) => {
            setPlayers(data);
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const computedHeight = screenWidth / aspectRatio;
            const computedWidth = screenHeight * aspectRatio;
            const width = screenWidth < computedWidth ? screenWidth : computedWidth;
            const height = screenHeight < computedHeight ? screenHeight : computedHeight;
            document.documentElement.style.setProperty('--game-width', `${width}px`);
            document.documentElement.style.setProperty('--game-height', `${height}px`);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [aspectRatio]);

    useEffect(() => {
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
            const beta = event.beta;
            const gamma = event.gamma;

            const sensitivity = 0.01;

            const newAcceleration = {
                x: gamma * sensitivity,
                y: beta * sensitivity
            };

            setAcceleration(newAcceleration);
        };

        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const maxVelocity = 10;

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
                x: prevPosition.x + velocity.x * 0.95,
                y: prevPosition.y + velocity.y * 0.95
            }));

            if (socket) {
                socket.emit('playerMove', { position });
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [acceleration, velocity, socket]);

    const handleBoundaryCollision = () => {
        if (position.x < 0 || position.x + ballSize > window.innerWidth) {
            setVelocity(prevVelocity => ({ ...prevVelocity, x: -prevVelocity.x }));
        }

        if (position.y < 0 || position.y + ballSize > window.innerHeight) {
            setVelocity(prevVelocity => ({ ...prevVelocity, y: -prevVelocity.y }));
        }
    };

    useEffect(() => {
        handleBoundaryCollision();
    }, [position, ballSize]);

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
