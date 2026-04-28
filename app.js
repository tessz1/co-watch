
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

const mapUsers = new Map();
const arrayNames = ["Neon", "Cyber", "Void", "Pixel", "Rust"];
function getRoomUsers(roomName) {
    const resultArray = [];

    for (const [id, user] of mapUsers) {
        if (user.room === roomName) {
            resultArray.push({
                id,
                name: user.name
            });
        }
    }

    return resultArray;
}
function updateRoom(roomName) {
    const clients = io.sockets.adapter.rooms.get(roomName);
    const sizeRoom = clients ? clients.size : 0;

    io.to(roomName).emit('online-update', {
        size: sizeRoom
    });

    io.to(roomName).emit('users-list', getRoomUsers(roomName));
}
function generateName() {
    const randomName =
        arrayNames[Math.floor(Math.random() * arrayNames.length)];
    const randomNumber = Math.floor(Math.random() * 1000);

    return `${randomName}${randomNumber}`;
}
io.on('connection', (socket) => {
    socket.on('join-room', (roomName) => {
        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
            updateRoom(socket.currentRoom);
        }
        socket.join(roomName);
        socket.currentRoom = roomName;
        const clients = io.sockets.adapter.rooms.get(roomName);
        const sizeRoom = clients ? clients.size : 0;
        const isLeader = sizeRoom === 1;

        mapUsers.set(socket.id, {
            name: generateName(),
            room: roomName
        });

        socket.emit('room-joined', {
            roomName,
            role: isLeader ? 'leader' : 'follower',
            size: sizeRoom
        });

        updateRoom(roomName);
    });

    socket.on('disconnect', () => {
        const roomName = socket.currentRoom;

        mapUsers.delete(socket.id);

        if (roomName) {
            updateRoom(roomName);
        }
    });
    socket.on('sync-event', (data) => {
        if (socket.currentRoom) {
            socket.to(socket.currentRoom).emit('sync-event', data);
        }
    });
    socket.on('my-time', (data) => {
        if (socket.currentRoom) {
            socket.to(socket.currentRoom).emit('remote-time', data);
        }
    });
    socket.on('sync-time', (data) => {
        if (socket.currentRoom) {
            socket.to(socket.currentRoom).emit('sync-time', data);
        }
    });
    socket.on('chat-message', (data) => {
        const date = new Date();
        const formatedTime = date.toLocaleTimeString().slice(0, -3)
        if (socket.currentRoom) {
            const currentUser = socket.id;
            const user = mapUsers.get(currentUser)
            const resultMessage = {
                message: data,
                name: user.name,
                time: formatedTime
            }
            io.to(socket.currentRoom).emit('chat-message', resultMessage);
        }
    });

});
server.listen(3333, () => {
    console.log('Сервер с WebSocket запущен на порту 3333');
});