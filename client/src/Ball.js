import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Trace from "./Trace";
import "./App.css";

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 }); // Initial acceleration is 0
    const ballSize = 20; // Size of the ball

    const calculatePlayZoneDimensions = () => {
        const standardWidth = 1920;
        const standardHeight = 1080;

        return { playZoneWidth: standardWidth, playZoneHeight: standardHeight };
    };

    const [playZoneDimensions, setPlayZoneDimensions] = useState(calculatePlayZoneDimensions());

    useEffect(() => {
        const handleResize = () => {
            setPlayZoneDimensions(calculatePlayZoneDimensions());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const newSocket = io('wss://achieved-safe-scourge.glitch.me/');
        setSocket(newSocket);

        newSocket.on('playerPositions', (data) => {
            setPlayers(data);
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y - 0.1 })); // Increase acceleration upwards
                    break;
                case 'ArrowDown':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y + 0.1 })); // Increase acceleration downwards
                    break;
                case 'ArrowLeft':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x - 0.1 })); // Increase acceleration leftwards
                    break;
                case 'ArrowRight':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x + 0.1 })); // Increase acceleration rightwards
                    break;
                default:
                    break;
            }
        };

        const handleDeviceOrientation = (event) => {
            const beta = event.beta; // Angle of tilt in the front-to-back direction (-180 to 180)
            const gamma = event.gamma; // Angle of tilt in the left-to-right direction (-90 to 90)

            // Adjust sensitivity here
            const sensitivity = 0.01; // Adjust this value to change sensitivity

            // Calculate acceleration based on gyroscope data
            const newAcceleration = {
                x: gamma * sensitivity, // Adjust sensitivity here
                y: beta * sensitivity // Adjust sensitivity here
            };

            setAcceleration(newAcceleration);
        };

        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, []);

    const maxVelocity = 10; // Set your desired maximum velocity

    useEffect(() => {
        const interval = setInterval(() => {
            // Update velocity based on acceleration
            let newVelocity = {
                x: velocity.x + acceleration.x,
                y: velocity.y + acceleration.y
            };

            // Clamp velocity to stay within the maximum allowed value
            newVelocity.x = Math.min(Math.max(newVelocity.x, -maxVelocity), maxVelocity);
            newVelocity.y = Math.min(Math.max(newVelocity.y, -maxVelocity), maxVelocity);

            setVelocity(newVelocity);

            // Update position based on velocity
            setPosition(prevPosition => ({
                x: prevPosition.x + newVelocity.x * 0.95,
                y: prevPosition.y + newVelocity.y * 0.95
            }));

            // Emit the position of the local player's ball to the server
            if (socket) {
                socket.emit('playerMove', { position });
            }
        }, 1000 / 60); // Update every 16.67 milliseconds for 60 FPS

        return () => clearInterval(interval);
    }, [acceleration, velocity, socket]); // Update when acceleration or velocity changes

    useEffect(() => {
        handleBoundaryCollision(playZoneDimensions.playZoneWidth, playZoneDimensions.playZoneHeight);
    }, [position, ballSize, playZoneDimensions]);

    const handleBoundaryCollision = (playZoneWidth, playZoneHeight) => {
        const scaleX = window.innerWidth / playZoneDimensions.playZoneWidth;
        const scaleY = window.innerHeight / playZoneDimensions.playZoneHeight;
        const scale = Math.min(scaleX, scaleY);

        // Check if the ball is crossing the left or right border
        if (position.x * scale < 0 || position.x * scale + ballSize > playZoneWidth) {
            setVelocity(prevVelocity => ({ ...prevVelocity, x: -prevVelocity.x }));
        }

        // Check if the ball is crossing the top or bottom border
        if (position.y * scale < 0 || position.y * scale + ballSize > playZoneHeight) {
            setVelocity(prevVelocity => ({ ...prevVelocity, y: -prevVelocity.y }));
        }
    };

    const playZoneStyle = {
        width: `${playZoneDimensions.playZoneWidth}px`,
        height: `${playZoneDimensions.playZoneHeight}px`,
        backgroundColor: 'white',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',  // Prevent scrolling
            position: 'relative'
        }} className={"fullscreen-center"}>
            <div style={playZoneStyle}>
                {Object.keys(players).map(playerId => (
                    <div
                        key={playerId}
                        style={{
                            width: `${ballSize}px`,
                            height: `${ballSize}px`,
                            borderRadius: '50%',
                            backgroundColor: 'darkolivegreen', // Change color for other players' balls
                            position: 'absolute',
                            top: `${players[playerId].y * scale}px`,
                            left: `${players[playerId].x * scale}px`,
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
                        top: `${position.y * scale}px`,
                        left: `${position.x * scale}px`,
                    }}
                ></div>
            </div>
        </div>
    );
};

export default Ball;
