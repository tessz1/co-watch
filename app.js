import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {

    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        socket.currentRoom = roomName;

        const clients = io.sockets.adapter.rooms.get(roomName);
        const isLeader = clients ? clients.size === 1 : true;

        socket.emit('room-joined', {
            roomName,
            role: isLeader ? 'leader' : 'follower'
        });
    });

    socket.on('sync-event', (data) => {
        socket.to(socket.currentRoom).emit('sync-event', data);
    });

    socket.on('my-time', (data) => {
        socket.to(socket.currentRoom).emit('remote-time', data);
    });

    socket.on('sync-time', (data) => {
        socket.to(socket.currentRoom).emit('sync-time', data);
    });

});

server.listen(3333, () => {
    console.log('Сервер с WebSocket запущен');
});