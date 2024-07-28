import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import { throttle } from 'lodash';

const Ball = () => {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [position, setPosition] = useState({ x: 0.02, y: 0.02 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0 });
    const [trail, setTrail] = useState([]);
    const [isDrawingTrail, setIsDrawingTrail] = useState(false);
    const [playerColor, setPlayerColor] = useState('#ff0000'); // Default color, will be updated from server
    const [trailColor, setTrailColor] = useState('#0000ff'); // Default trail color, will be updated from server
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

    const MAX_TRAIL_LENGTH = 3000;

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
            if (data[newSocket.id]) {
                setPlayerColor(data[newSocket.id].playerColor);
                setTrailColor(data[newSocket.id].trailColor);
            }
        });

        newSocket.on('playerMove', ({ playerId, position, trail, playerColor, trailColor }) => {
            setPlayers(prevPlayers => ({
                ...prevPlayers,
                [playerId]: {
                    ...prevPlayers[playerId],
                    position,
                    trail: trail || prevPlayers[playerId].trail,
                    playerColor: playerColor || prevPlayers[playerId].playerColor,
                    trailColor: trailColor || prevPlayers[playerId].trailColor,
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

    const maxVelocity = 0.01;

    useEffect(() => {
        const emitPlayerMoveThrottled = throttle((data) => {
            socket.emit('playerMove', data);
        }, 2000);

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
                    setTrail(prevTrail => {
                        const newTrail = [...prevTrail, newPosition];
                        if (newTrail.length > MAX_TRAIL_LENGTH) {
                            newTrail.shift();
                        }
                        return newTrail;
                    });
                }

                if (socket) {
                    emitPlayerMoveThrottled({ position: newPosition, isDrawingTrail });
                }

                return newPosition;
            });
        }, 1000 / 60);

        return () => {
            clearInterval(interval);
            emitPlayerMoveThrottled.cancel();
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

    const handleTouchStart = (e) => {
        e.preventDefault();
        setIsDrawingTrail(true);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
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
                    player.trail.forEach((trailPosition, index, array) => {
                        if (index < array.length - 1) {
                            const nextTrailPosition = array[index + 1];
                            ctx.beginPath();
                            ctx.moveTo(trailPosition.x * playZoneWidth, trailPosition.y * playZoneHeight);
                            ctx.lineTo(nextTrailPosition.x * playZoneWidth, nextTrailPosition.y * playZoneHeight);
                            ctx.strokeStyle = player.trailColor;
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
                    ctx.fillStyle = player.playerColor;
                    ctx.fill();
                });
            } else {
                if (trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(trail[0].x * playZoneWidth, trail[0].y * playZoneHeight);

                    for (let i = 1; i < trail.length; i++) {
                        ctx.lineTo(trail[i].x * playZoneWidth, trail[i].y * playZoneHeight);
                    }

                    ctx.strokeStyle = trailColor;
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
                ctx.fillStyle = playerColor;
                ctx.fill();
            }
        };

        draw();
    }, [players, position, trail, ballSize, playZoneDimensions, isPhone, playerColor, trailColor]);

    const buttonStyle = {
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%) rotate(90deg)',
        width: '90px', // Adjust width and height for your button size
        height: '90px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '16px',
        backgroundColor: isDrawingTrail ? '#b30000' : '#ff0000', // darker red on drawing
        color: '#fff', // text color
        border: 'none',
        outline: 'none',
        borderRadius: '50%',
    };

    const svgStyle = {
        verticalAlign: 'middle',
    };

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
                    style={buttonStyle}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" style={svgStyle}>
                        <path d="M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T320-280q0-17-11.5-28.5T280-320q-17 0-28.5 11.5T240-280q0 23-5.5 42T220-202q5 2 10 2h10Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Zm-190 80Z" fill={isDrawingTrail ? '#fce4e4' : '#e8eaed'} />
                    </svg>



                </button>
            )}
        </div>
    );
};

export default Ball;
