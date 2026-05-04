import { getRoomUsers } from '../store/users.store.js'
export function updateRoom(io, roomName) {
    const clients = io.sockets.adapter.rooms.get(roomName);
    const sizeRoom = clients ? clients.size : 0;

    io.to(roomName).emit('online-update', {
        size: sizeRoom
    });

    io.to(roomName).emit('users-list', getRoomUsers(roomName));
}