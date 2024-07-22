import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import { throttle } from 'lodash'; // Import throttle function from lodash

const Ball2 = () => {
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

    const MAX_TRAIL_LENGTH = 150; // Define maximum number of trail positions

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
        //const newSocket = io('http://localhost:4000');

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

    const handleTouchStart = (e) => {
        e.preventDefault(); // Prevent default touch behavior
        setIsDrawingTrail(true);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault(); // Prevent default touch behavior
        setIsDrawingTrail(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!playZoneDimensions) return;

            const { playZoneWidth, playZoneHeight } = playZoneDimensions;
            canvas.width = playZoneWidth;
            canvas.height = playZoneHeight;

            ctx.clearRect(0, 0, playZoneWidth, playZoneHeight);

            if (!isPhone()) {
                Object.keys(players).forEach(playerId => {
                    const player = players[playerId];
                    player.trail.forEach(segment => {
                        if (segment.length > 1) {
                            ctx.beginPath();
                            ctx.moveTo(segment[0].x * playZoneWidth, segment[0].y * playZoneHeight);

                            for (let i = 1; i < segment.length; i++) {
                                ctx.lineTo(segment[i].x * playZoneWidth, segment[i].y * playZoneHeight);
                            }

                            ctx.strokeStyle = 'blue';
                            ctx.lineWidth = ballSize * playZoneWidth / 4;
                            ctx.globalAlpha = 0.5;
                            ctx.stroke();
                        }
                    });

                    ctx.globalAlpha = 1.0;
                    ctx.beginPath();
                    ctx.arc(
                        player.position.x * playZoneWidth,
                        player.position.y * playZoneHeight,
                        ballSize * playZoneWidth / 2,
                        0, 2 * Math.PI
                    );
                    ctx.fillStyle = 'darkolivegreen';
                    ctx.fill();
                });
            } else {
                if (trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(trail[0].x * playZoneWidth, trail[0].y * playZoneHeight);

                    for (let i = 1; i < trail.length; i++) {
                        ctx.lineTo(trail[i].x * playZoneWidth, trail[i].y * playZoneHeight);
                    }



                    ctx.strokeStyle = 'blue';
                    ctx.lineWidth = ballSize * playZoneWidth / 4;
                    ctx.globalAlpha = 0.5;
                    ctx.stroke();
                }

                ctx.globalAlpha = 1.0;
                ctx.beginPath();
                ctx.arc(
                    position.x * playZoneWidth,
                    position.y * playZoneHeight,
                    ballSize * playZoneWidth / 2,
                    0, 2 * Math.PI
                );
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        };

        draw();
    }, [players, position, trail, ballSize, playZoneDimensions, isPhone]);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'transparent',
            display: 'flex',
            overflow: 'hidden',
        }} className={"fullscreen-center"}>

            <canvas ref={canvasRef} style={{
                width: playZoneDimensions ? `${playZoneDimensions.playZoneWidth}px` : '100%',
                height: playZoneDimensions ? `${playZoneDimensions.playZoneHeight}px` : '100%',
                backgroundColor: 'white',
                margin: 'auto',
                overflow: 'hidden',
            }} />

            {isPhone() && (
                <button
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '20px 30px',
                        fontSize: '16px',
                    }}
                >
                    Draw
                </button>
            )}
        </div>
    );
};

export default Ball2;
