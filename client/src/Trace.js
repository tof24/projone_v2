// Trace.js
import React from 'react';

const Trace = ({ position }) => {
    const traceSize = 5; // Size of the trace circle
    const traceOpacity = 0.5; // Opacity of the trace

    return (
        <div
            style={{
                width: `${traceSize}px`,
                height: `${traceSize}px`,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 0, 0, ' + traceOpacity + ')',
                position: 'absolute',
                top: `${position.y - traceSize / 2}px`, // Adjust position to center the trace
                left: `${position.x - traceSize / 2}px`, // Adjust position to center the trace
            }}
        ></div>
    );
};

export default Trace;
