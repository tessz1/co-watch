
import express from 'express';
import http from 'http';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
const prisma = new PrismaClient()
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.json())
// __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static
app.use(express.static(path.join(__dirname, 'public')));
app.get('/room/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
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
    socket.on('join-room', async (roomName) => {
        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
            updateRoom(socket.currentRoom);
        }
        socket.join(roomName);
        const roomFromDB = await prisma.room.findUnique({
            where: { id: roomName }
        });
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
            isPlaying: roomFromDB.isPlaying,
            currentTime: roomFromDB.currentTime,
            videoUrl: roomFromDB.videoUrl,
            name: roomFromDB.name,
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
    socket.on('sync-event', async (data) => {
        if (socket.currentRoom) {
            const roomID = await prisma.room.findUnique({
                where: { id: socket.currentRoom },
            })
            console.log(roomID)
            switch (data.type) {
                case 'seek':
                    await prisma.room.update({
                        where: { id: socket.currentRoom },
                        data: { currentTime: data.time }
                    })
                    break
                case 'play':
                    await prisma.room.update({
                        where: { id: socket.currentRoom },
                        data: { isPlaying: true, currentTime: data.time }
                    })
                    break;
                case 'pause':
                    await prisma.room.update({
                        where: { id: socket.currentRoom },
                        data: { isPlaying: false }
                    })
                    break;
                case 'load-video':
                    await prisma.room.update({
                        where: { id: socket.currentRoom },
                        data: { videoUrl: data.url, isPlaying: false, currentTime: 0 }
                    })
                    break;
            }
            io.to(socket.currentRoom).emit('sync-event', await prisma.room.findUnique({
                where: { id: socket.currentRoom }
            }));
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
    socket.on('exitRoom', () => {
        if (!mapUsers.has(socket.id)) return
        mapUsers.delete(socket.id)
        socket.leave(socket.currentRoom)
        updateRoom(socket.currentRoom)
        socket.currentRoom = ''
        socket.emit('exitRoom')
    })

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
app.post('/api/room', async (req, res) => {
    try {
        const { name } = req.body
        const room = await prisma.room.create({
            data: { name }
        })
        res.json({
            roomId: room.id,
            name: name
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Ошибка на сервере блок room" })
    }
})

app.get('/api/room/:id', async (req, res) => {
    try {
        const roomID = await prisma.room.findUnique({
            where: { id: id },
        })
        req.json({
            name: room.name
        })
    } catch (e) {
        console.error(`${e} error on get server room ID`)
        res.status(500).json({ e: "error on get server room ID" })
    }
})


server.listen(3333, () => {
    console.log('Сервер с WebSocket запущен на порту 3333');
});