const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express()
const server = http.createServer(app)
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', (socket) => {
    socket.on('sync-event', (data) => {
        socket.broadcast.emit('sync-event', data);
    });
    socket.on('my-time', (data) => {
        socket.broadcast.emit('remote-time', data);
    });
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        socket.currentRoom = roomName;
        const clients = io.sockets.adapter.rooms.get(roomName);
        const isLeader = clients ? clients.size === 1 : true;
        socket.emit('room-joined', {
            roomName: roomName,
            role: isLeader ? 'leader' : 'follower'
        });
    });
    socket.on('sync-time', (data) => {
        socket.to(socket.currentRoom).emit('sync-time', data);
    });
    socket.on('sync-event', (data) => {
        socket.to(socket.currentRoom).emit('sync-event', data);
    });
})



server.listen(3333, () => {
    console.log('Сервер с WebSocket запущен');
});