import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import "./App.css";
import { throttle } from 'lodash'; // Import throttle function from lodash

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 0.02, y: 0.02 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
    const [trail, setTrail] = useState([]);
    const [isDrawingTrail, setIsDrawingTrail] = useState(false);
    const ballSize = 0.04;

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

    const [playZoneDimensions, setPlayZoneDimensions] = useState(null);
    const canvasRef = useRef(null);

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

        newSocket.on('playerMove', ({ playerId, position, trail }) => {
            setPlayers(prevPlayers => ({
                ...prevPlayers,
                [playerId]: {
                    ...prevPlayers[playerId],
                    position,
                    trail: trail || prevPlayers[playerId].trail,
                }
            }));
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        const handleDeviceOrientation = (event) => {
            const beta = event.beta;
            const gamma = event.gamma;
            const sensitivity = 0.000005;

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

    const maxVelocity = 0.1;

    useEffect(() => {
        const emitPlayerMoveThrottled = throttle((data) => {
            socket.emit('playerMove', data);
        }, 100); // Throttle to emit every 100ms

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
                    updateTrail(newPosition);
                }

                if (socket) {
                    emitPlayerMoveThrottled({ position: newPosition, isDrawingTrail });
                }

                return newPosition;
            });
        }, 1000 / 80);

        return () => {
            clearInterval(interval);
            emitPlayerMoveThrottled.cancel(); // Cancel throttled function on component unmount
        };
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

    const MAX_TRAIL_LENGTH = 50;

    const updateTrail = (newPosition) => {
        setTrail(prevTrail => {
            const updatedTrail = [...prevTrail, newPosition];
            return updatedTrail.slice(-MAX_TRAIL_LENGTH); // Keep only the last MAX_TRAIL_LENGTH items
        });
    };

    const draw = () => {
        if (!playZoneDimensions) return;

        const { playZoneWidth, playZoneHeight } = playZoneDimensions;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = playZoneWidth;
        canvas.height = playZoneHeight;

        ctx.clearRect(0, 0, playZoneWidth, playZoneHeight);

        // Draw trail markers
        trail.forEach(trailPosition => {
            ctx.beginPath();
            ctx.arc(
                trailPosition.x * playZoneWidth,
                trailPosition.y * playZoneHeight,
                ballSize * playZoneWidth / 2,
                0, 2 * Math.PI
            );
            ctx.fillStyle = 'blue';
            ctx.globalAlpha = 0.01;
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw current position
        ctx.beginPath();
        ctx.arc(
            position.x * playZoneWidth,
            position.y * playZoneHeight,
            ballSize * playZoneWidth / 2,
            0, 2 * Math.PI
        );
        ctx.fillStyle = 'red';
        ctx.fill();
    };

    useEffect(() => {
        draw();
    }, [trail, position, playZoneDimensions]);

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

            {!isPhone() && Object.keys(players).map(playerId => (
                <React.Fragment key={playerId}>
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
                                opacity: 0.01,
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
                    />
                </React.Fragment>
            ))}

            {isPhone() && (
                <canvas ref={canvasRef} style={{
                    width: playZoneDimensions ? `${playZoneDimensions.playZoneWidth}px` : '100%',
                    height: playZoneDimensions ? `${playZoneDimensions.playZoneHeight}px` : '100%',
                    backgroundColor: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }} />
            )}

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
