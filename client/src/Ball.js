import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import "./App.css"

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 0.02, y: 0.02 }); // Normalized initial position (0.02 of play zone dimensions)
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
    const [trail, setTrail] = useState([]); // State for the trail coordinates
    const [isDrawingTrail, setIsDrawingTrail] = useState(false); // State to track if the trail should be drawn
    const ballSize = 0.04; // Normalized size of the ball (2% of play zone dimensions)

    const playZoneAspectRatio = 1080 / 1920; // Aspect ratio of the play zone

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

        return { playZoneWidth, playZoneHeight };
    }, [playZoneAspectRatio]);

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
            let newVelocity = {
                x: velocity.x + acceleration.x,
                y: velocity.y + acceleration.y
            };

            newVelocity.x = Math.min(Math.max(newVelocity.x, -maxVelocity), maxVelocity);
            newVelocity.y = Math.min(Math.max(newVelocity.y, -maxVelocity), maxVelocity);

            setVelocity(newVelocity);

            setPosition(prevPosition => {
                const newPosition = {
                    x: prevPosition.x + newVelocity.x,
                    y: prevPosition.y + newVelocity.y
                };

                if (isDrawingTrail) {
                    setTrail(prevTrail => [...prevTrail, newPosition]);
                }

                if (socket) {
                    socket.emit('playerMove', { position: newPosition, isDrawingTrail });
                }

                return newPosition;
            });
        }, 1000 / 100);

        return () => clearInterval(interval);
    }, [acceleration, velocity, isDrawingTrail, socket]);

    const handleBoundaryCollision = useCallback(() => {
        if (position.x < 0 || position.x + ballSize > 1) {
            setVelocity(prevVelocity => ({ ...prevVelocity, x: -prevVelocity.x }));
        }

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
        position: 'relative',
        overflow: 'hidden',
        top: '0',
    };

    const isPhone = useCallback(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }, []);

    const handleTouchStart = () => {
        setIsDrawingTrail(true);
    };

    const handleTouchEnd = () => {
        setIsDrawingTrail(false);
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
        }} className={"fullscreen-center"}>

            <div style={playZoneStyle}>
                {!isPhone() && Object.keys(players).map(playerId => (
                    <div key={playerId}>
                        {players[playerId].trail.map((trailPosition, index) => (
                            <div
                                key={index}
                                style={{
                                    width: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                    height: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                    borderRadius: '50%',
                                    backgroundColor: 'blue',
                                    position: 'absolute',
                                    top: `${trailPosition.y * (playZoneDimensions ? playZoneDimensions.playZoneHeight : 0)}px`,
                                    left: `${trailPosition.x * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                    opacity: 0.5,
                                }}
                            />
                        ))}
                        <div
                            style={{
                                width: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                height: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                borderRadius: '50%',
                                backgroundColor: 'darkolivegreen',
                                position: 'absolute',
                                top: `${players[playerId].position.y * (playZoneDimensions ? playZoneDimensions.playZoneHeight : 0)}px`,
                                left: `${players[playerId].position.x * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                            }}
                        >
                        </div>
                    </div>
                ))}
                {isPhone() && (
                    <div>
                        {trail.map((trailPosition, index) => (
                            <div
                                key={index}
                                style={{
                                    width: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                    height: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                    borderRadius: '50%',
                                    backgroundColor: 'blue',
                                    position: 'absolute',
                                    top: `${trailPosition.y * (playZoneDimensions ? playZoneDimensions.playZoneHeight : 0)}px`,
                                    left: `${trailPosition.x * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                    opacity: 0.5,
                                }}
                            />
                        ))}
                        <div
                            style={{
                                width: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
                                height: `${ballSize * (playZoneDimensions ? playZoneDimensions.playZoneWidth : 0)}px`,
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
            {isPhone() && (
                <button
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '10px 20px',
                        fontSize: '16px',
                    }}
                >
                    o
                </button>
            )}
        </div>
    );
};

export default Ball;
