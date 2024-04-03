// server.js

const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// Configure CORS for regular HTTP requests
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

    // Assign a unique ID to the player
    const playerId = socket.id;
    players[playerId] = { x: 20, y: 20 }; // Initial position

    // Emit player positions to all clients
    io.emit('playerPositions', players);

    // Handle player movement
    socket.on('playerMove', (data) => {
        players[playerId] = data.position;
        io.emit('playerPositions', players);
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
