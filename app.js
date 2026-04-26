const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express()
const server = http.createServer(app)
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', (socket) => {
    socket.join("some room");
    console.log('Пользователь подключился:', socket.id);
    socket.on('sync-event', (data) => {
        socket.broadcast.emit('sync-event', data);
    });
    socket.on('my-time', (data) => {
        socket.broadcast.emit('remote-time', data);
    });
});



server.listen(3333, () => {
    console.log('Сервер с WebSocket запущен');
});