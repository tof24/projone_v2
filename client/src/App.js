import logo from './logo.svg';
import Orientation from "./Orientation";
import Ball from "./Ball";
import Portrait from "./Portrait";
import "./App.css"
import React, {useCallback, useEffect, useState} from "react";
import Ball2 from "./Ball2";
import StartScreen from "./StartScreen";
import MobileStartScreen from "./MobileStartScreen";





function App() {

    const [isStart, setIsStart] = useState(false);

    console.log()


    useEffect(() => {
        const options = {
            "animate": true,
            "patternWidth": 500,
            "patternHeight": 500,
            "grainOpacity": 0.17,
            "grainDensity": 3.57,
            "grainWidth": 1,
            "grainHeight": 1.79,
        };
        if (window.grained) {
            window.grained(document.getElementById('beggin'), options);
        }
    }, []);

    const isPhone = useCallback(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }, []);


    const handleClick = () =>{
        console.log("rewrwer")
    }

    return (
        <div>
            import React, { useState, useEffect } from 'react';

            const Orientation = () => {
            const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
            const [permissionGranted, setPermissionGranted] = useState(false);

            useEffect(() => {
            const handleOrientation = event => {
            setOrientation({
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma
        });
        };

            const requestPermission = async () => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
            const response = await DeviceOrientationEvent.requestPermission();
            if (response === 'granted') {
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            console.warn('Permission to access device orientation was denied.');
        }
        } catch (error) {
            console.error('Error requesting device orientation permission:', error);
        }
        } else {
            // If permission request API is not available, assume permissions are granted (pre-iOS 13)
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        };

            requestPermission();

            return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
        }, []); // Empty array as dependency to run only once on component mount

            return (
            <div>
            <h2>Gyroscope Data:</h2>
        {permissionGranted ? (
            <>
            <p>Alpha: {orientation.alpha}</p>
            <p>Beta: {orientation.beta}</p>
            <p>Gamma: {orientation.gamma}</p>
            </>
            ) : (
            <p>Permission to access device orientation was not granted.</p>
            )}
            </div>
            );
        };

            export default Orientation;

        </div>
    );
}

export default App;
