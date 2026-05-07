import { clientState } from "../storage/storage.js";
export let syncInterval = null
export function autoSync(isLeader, isPlaying) {
    if (syncInterval !== null) {
        clearInterval(syncInterval);
        syncInterval = null;
    }

    if (isLeader && syncInterval == null && isPlaying) {
        syncInterval = setInterval(() => {
            socket.emit('sync-time', { currentTime: clientState.currentTime })
        }, 5000)
    }
}

export function stopSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}