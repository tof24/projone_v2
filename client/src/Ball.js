import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import "./App.css";

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 0.02, y: 0.02 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
    const ballSize = 0.04;
    const [isPortrait, setIsPortrait] = useState(true);

    const playZoneAspectRatio = 1080 / 1920;

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

    const [playZoneDimensions, setPlayZoneDimensions] = useState(calculatePlayZoneDimensions);

    const isPhone = useCallback(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }, []);

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsPortrait(window.matchMedia('(orientation: portrait)').matches);
        };

        handleOrientationChange();
        window.addEventListener('orientationchange', handleOrientationChange);
        return () => window.removeEventListener('orientationchange', handleOrientationChange);
    }, []);

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
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y - 0.001 }));
                    break;
                case 'ArrowDown':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, y: prevAcceleration.y + 0.001 }));
                    break;
                case 'ArrowLeft':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x - 0.001 }));
                    break;
                case 'ArrowRight':
                    setAcceleration(prevAcceleration => ({ ...prevAcceleration, x: prevAcceleration.x + 0.001 }));
                    break;
                default:
                    break;
            }
        };

        const handleDeviceOrientation = (event) => {
            const beta = event.beta;
            const gamma = event.gamma;
            const sensitivity = 0.00001;

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
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, []);

    const maxVelocity = 0.1;

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
                socket.emit('playerMove', { position });
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [acceleration, velocity, socket]);

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
            overflow: 'hidden',
            position: 'relative',
        }} className={"fullscreen-center"}>
            <div style={playZoneStyle}>
                {!isPhone() ? (
                    Object.keys(players).map(playerId => (
                        <div
                            key={playerId}
                            style={{
                                width: `${ballSize * playZoneDimensions.playZoneWidth}px`,
                                height: `${ballSize * playZoneDimensions.playZoneWidth}px`,
                                borderRadius: '50%',
                                backgroundColor: 'darkolivegreen',
                                position: 'absolute',
                                top: `${players[playerId].y * playZoneDimensions.playZoneHeight}px`,
                                left: `${players[playerId].x * playZoneDimensions.playZoneWidth}px`,
                            }}
                        />
                    ))
                ) : (
                    <div>
                        <div
                            style={{
                                width: `${ballSize * playZoneDimensions.playZoneWidth}px`,
                                height: `${ballSize * playZoneDimensions.playZoneWidth}px`,
                                borderRadius: '50%',
                                backgroundColor: 'red',
                                position: 'absolute',
                                top: `${position.y * playZoneDimensions.playZoneHeight}px`,
                                left: `${position.x * playZoneDimensions.playZoneWidth}px`,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ball;
