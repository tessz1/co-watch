
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { handleJoinRoom, handleChatMessage, handleSyncEvent, handleExitRoom, handleSyncTime } from './sockets/room.socket.js'
import { prisma } from './db/prisma.js';
import app from './app.js';
const server = http.createServer(app);
const io = new Server(server);
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

io.on('connection', (socket) => {
    socket.on('join-room', handleJoinRoom(io, socket));
    socket.on('sync-event', handleSyncEvent(io, socket));
    socket.on('sync-time', handleSyncTime(io, socket));
    socket.on('chat-message', handleChatMessage(io, socket));

    socket.on('disconnect', () => {
        handleExitRoom(io, socket)();
    });
});


async function setParamRoom(playing, event, time, roomID) {
    const res = await fetch(`/api/room/${roomID}`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            isPlaying: playing,
            type: event,
            currentTime: time,
        })
    })
}

server.listen(3333, () => {
    console.log('Сервер с WebSocket запущен на порту 3333');
});