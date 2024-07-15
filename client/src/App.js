import logo from './logo.svg';
import Orientation from "./Orientation";
import Ball from "./Ball";
import Portrait from "./Portrait";
import "./App.css"
import React, {useCallback} from "react";
import Ball2 from "./Ball2";



function App() {
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
