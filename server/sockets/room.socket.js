import { getUser, removeUser, addUser } from '../store/users.store.js'
import { generateName } from '../utils/random.js';
import { prisma } from '../db/prisma.js'
import { updateRoom } from '../utils/updateRoom.js'



export function handleJoinRoom(io, socket) {
    return async (roomName) => {
        try {
            if (socket.currentRoom) {
                socket.leave(socket.currentRoom);
                updateRoom(io, socket.currentRoom);
            }

            socket.join(roomName);

            const roomFromDB = await prisma.room.findUnique({
                where: { id: roomName }
            });

            if (!roomFromDB) {
                socket.emit('error', 'ROOM NOT FOUND');
                return;
            }
            socket.currentRoom = roomName;
            const clients = io.sockets.adapter.rooms.get(roomName);
            const sizeRoom = clients ? clients.size : 0;
            const isLeader = sizeRoom === 1;
            addUser(socket.id, {
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

            updateRoom(io, roomName);

        } catch (e) {
            console.error('JOIN ERROR:', e);
        }
    };
}

export function handleExitRoom(io, socket) {
    return () => {
        if (!socket.currentRoom) return;
        const roomName = socket.currentRoom;
        removeUser(socket.id)
        socket.leave(socket.currentRoom);
        if (roomName) {
            updateRoom(io, roomName);
        }
        socket.currentRoom = null;
        socket.emit('exitRoom');
    }
}


export function handleSyncEvent(io, socket) {
    return async (data) => {
        try {
            if (!socket.currentRoom) {
                console.log('NO ROOM');
                return;
            }
            if (!data || !data.type) return;
            let updateData = {};
            switch (data.type) {
                case 'seek':
                    updateData = { currentTime: data.time };
                    break;

                case 'play':
                    updateData = {
                        isPlaying: true,
                        currentTime: data.time
                    };
                    break;

                case 'pause':
                    updateData = { isPlaying: false };
                    break;

                case 'load-video':
                    updateData = {
                        videoUrl: data.url,
                        isPlaying: false,
                        currentTime: 0
                    };
                    break;

                default:
                    return;
            }
            const room = await prisma.room.update({
                where: { id: socket.currentRoom },
                data: updateData
            });

            io.to(socket.currentRoom).emit('sync-event', {
                type: data.type,
                ...room
            });

        } catch (e) {
            console.error('SYNC ERROR:', e);
        }
    };
}

export function handleSyncTime(io, socket) {
    return (data) => {
        if (!socket.currentRoom) return
        socket.to(socket.currentRoom).emit('sync-time', data);
    }
}

export function handleChatMessage(io, socket) {
    return (data) => {
        const date = new Date();
        const formatedTime = date.toLocaleTimeString().slice(0, -3)
        if (socket.currentRoom) {
            const currentUser = socket.id;
            const user = getUser(socket.id);
            if (!user) return;
            const resultMessage = {
                message: data,
                name: user.name,
                time: formatedTime
            }
            io.to(socket.currentRoom).emit('chat-message', resultMessage);
        }
    }
}
