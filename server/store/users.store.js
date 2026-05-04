const mapUsers = new Map();

export function addUser(id, data) {
    mapUsers.set(id, data);
}

export function removeUser(id) {
    mapUsers.delete(id);
}

export function getUser(id) {
    return mapUsers.get(id);
}

export function getRoomUsers(roomName) {
    return [...mapUsers.entries()]
        .filter(([_, user]) => user.room === roomName)
        .map(([id, user]) => ({
            id,
            name: user.name
        }));
}