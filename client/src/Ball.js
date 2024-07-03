import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import Trace from "./Trace";
import "./App.css"
import { logDOM } from "@testing-library/react";
import Orientation from "./Orientation";
import Portrait from "./Portrait";

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 0.02, y: 0.02 }); // Normalized initial position (0.02 of play zone dimensions)
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
    const ballSize = 0.04; // Normalized size of the ball (4% of play zone dimensions)

    const playZoneAspectRatio = 1080 / 1920; // Aspect ratio of the play zone
    const scalingFactor = 2; // Scaling factor to increase the size by 20%

    const calculatePlayZoneDimensions = useCallback(() => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let playZoneWidth, playZoneHeight;

        if (viewportWidth / viewportHeight < playZoneAspectRatio) {
            playZoneWidth = viewportWidth;
            playZoneHeight = viewportWidth / playZoneAspectRatio;
        } else {
            playZoneHeight = viewportHeight;
            playZoneWidth = viewportHeight * playZoneAspectRatio;
        }

        // Apply scaling factor
        playZoneWidth *= scalingFactor;
        playZoneHeight *= scalingFactor;

        // Ensure it does not exceed viewport dimensions
        if (playZoneWidth > viewportWidth) {
            playZoneWidth = viewportWidth;
            playZoneHeight = playZoneWidth / playZoneAspectRatio;
        }

        if (playZoneHeight > viewportHeight) {
            playZoneHeight = viewportHeight;
            playZoneWidth = playZoneHeight * playZoneAspectRatio;
        }

        return { playZoneWidth, playZoneHeight };
    }, [playZoneAspectRatio, scalingFactor]);

    const [playZoneDimensions, setPlayZoneDimensions] = useState(null);

    useEffect(() => {
        setPlayZoneDimensions(calculatePlayZoneDimensions());
    }, [calculatePlayZoneDimensions]);

    useEffect(() => {
        const handleResize = () => {
            setPlayZoneDimensions(calculatePlayZoneDimensions());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculatePlayZoneDimensions]);

    useEffect(() => {
        const newSocket = io('wss://achieved-safe-scourge.glitch.me/');
        setSocket(newSocket);

        newSocket.on('playerPositions', (data) => {
            setPlayers(data);
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        const handleDeviceOrientation = (event) => {
            const beta = event.beta; // Angle of tilt in the front-to-back direction (-180 to 180)
            const gamma = event.gamma; // Angle of tilt in the left-to-right direction (-90 to 90)

            // Adjust sensitivity here
            const sensitivity = 0.000005; // Adjust this value to change sensitivity

            // Calculate acceleration based on gyroscope data
            const newAcceleration = {
                x: gamma * sensitivity,
                y: beta * sensitivity
            };

            setAcceleration(newAcceleration);
        };

        window.addEventListener('deviceorientation', handleDeviceOrientation);

        return () => {
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, []);

    const maxVelocity = 0.1; // Set your desired maximum velocity

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
                x: prevPosition.x + newVelocity.x,
                y: prevPosition.y + newVelocity.y
            }));

            // Emit the position of the local player's ball to the server
            if (socket) {
                socket.emit('playerMove', { position });
            }
        }, 1000 / 100); // Update every 10 milliseconds for 100 FPS

        return () => clearInterval(interval);
    }, [acceleration, velocity, socket]); // Update when acceleration or velocity changes

    const handleBoundaryCollision = useCallback(() => {
        // Check if the ball is crossing the left or right border
        if (position.x < 0 || position.x + ballSize > 1) {
            setVelocity(prevVelocity => ({ ...prevVelocity, x: -prevVelocity.x }));
        }

        // Check if the ball is crossing the top or bottom border
        if (position.y < 0 || position.y + ballSize > 1) {
            setVelocity(prevVelocity => ({ ...prevVelocity, y: -prevVelocity.y }));
        }
    }, [position, ballSize]);

    useEffect(() => {
        handleBoundaryCollision();
    }, [position, ballSize, handleBoundaryCollision]);

    const playZoneStyle = {
        width: playZoneDimensions ? `${playZoneDimensions.playZoneWidth}px` : '100%',
        height: playZoneDimensions ? `${playZoneDimensions.playZoneHeight}px` : '100%',
        backgroundColor: 'white',
        position: 'absolute',
        overflow: 'hidden',
        top: playZoneDimensions ? `calc(50% - ${playZoneDimensions.playZoneHeight / 2}px)` : '0',
        left: playZoneDimensions ? `calc(50% - ${playZoneDimensions.playZoneWidth / 2}px)` : '0',
    };

    const isPhone = useCallback(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',  // Prevent scrolling
            position: 'relative',
        }} className={"fullscreen-center"}>

            <div style={playZoneStyle}>
                {!isPhone() && Object.keys(players).map(playerId => (
                    <div
                        key={playerId}
                        style={{
                            width: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                            height: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`, // Keep ball round
                            borderRadius: '50%',
                            backgroundColor: 'darkolivegreen', // Change color for other players' balls
                            position: 'absolute',
                            top: `${players[playerId].y * (playZoneDimensions ? playZoneDimensions.playZoneHeight : 0)}px`,
                            left: `${players[playerId].x * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                        }}
                    >
                    </div>
                ))}
                {isPhone() && (
                    <div>
                        <Portrait></Portrait>
                        <div
                            style={{
                                width: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                height: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`, // Keep ball round
                                borderRadius: '50%',
                                backgroundColor: 'red',
                                position: 'absolute',
                                top: `${position.y * (playZoneDimensions ? playZoneDimensions.playZoneHeight : 0)}px`,
                                left: `${position.x * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                            }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ball;
