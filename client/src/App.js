import logo from './logo.svg';
import Orientation from "./Orientation";
import Ball from "./Ball";
import Portrait from "./Portrait";
import "./App.css"
import React, {useCallback, useEffect} from "react";
import Ball2 from "./Ball2";
import useScript from "./useScript";




function App() {



    useScript(`${process.env.PUBLIC_URL}/grained.js`);

    useEffect(() => {
        var options = {
            "animate": true,
            "patternWidth": 500,
            "patternHeight": 500,
            "grainOpacity": 0.17,
            "grainDensity": 3.57,
            "grainWidth": 1,
            "grainHeight": 1.79,
        }
        if (window.grained) {
            window.grained(document.getElementById('pc'), options);
        }
    }, []);

    const isPhone = useCallback(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }, []);
    return (
        <div>
            <div>
                {isPhone() && (
                    <div>
                        <Portrait></Portrait>
                        <Ball></Ball>
                    </div>
                )}
                {!isPhone() && (
                    <div id={"pc"} className={"display"}>
                        <div className={"zoomed-div"}>
                            <Ball2  class={""}></Ball2>
                        </div>
                    </div>
                )}

            </div>
        </div>

    );
}

export default App;
