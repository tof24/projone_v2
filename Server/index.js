// server.js

const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

let players = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    const playerId = socket.id;
    players[playerId] = { position: { x: 20, y: 20 }, trail: [] }; // Initial position and empty trail

    io.emit('playerPositions', players);

    socket.on('playerMove', (data) => {
        if (players[playerId]) {
            players[playerId].position = data.position;
            if (data.isDrawingTrail) {
                players[playerId].trail.push(data.position);
            }
            io.emit('playerPositions', players);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete players[playerId];
        io.emit('playerPositions', players);
    });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
