import logo from './logo.svg';
import Orientation from "./Orientation";
import Ball from "./Ball";
import Portrait from "./Portrait";
import "./App.css"
import React, {useCallback} from "react";



function App() {
    const isPhone = useCallback(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }, []);
  return (
      <div>
          <p style={"color:white"}>HELLOOOOOOOOOO</p>
          {isPhone() && (
          <Portrait></Portrait>
          )}
        <Ball></Ball>
      </div>
  );
}

export default App;
