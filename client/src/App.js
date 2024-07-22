import logo from './logo.svg';
import Orientation from "./Orientation";
import Ball from "./Ball";
import Portrait from "./Portrait";
import "./App.css"
import React, {useCallback, useEffect, useState} from "react";
import Ball2 from "./Ball2";
import StartScreen from "./StartScreen";





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
            window.grained(document.getElementById('pc'), options);
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
            <div id={"pc"} className={"display"}>

                {!isPhone() && (
                    <div>
                        <div className={"zoomed-div"}>
                            <Ball2 class={""} />
                        </div>
                    </div>
                )}
            </div>

            {isPhone() && (
                <div>
                    <Portrait />
                    <Ball />
                </div>
            )}
        </div>
    );
}

export default App;
