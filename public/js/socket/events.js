
import { exitRoomUI, updateOnlineUI, joinRoomUI, chatMessageUI, userList } from "../utils/updateUI.js";
import { safePostMessage, statusDiv } from "../helper/helper.js";
import { clientState } from "../storage/storage.js";
import { autoSync, stopSync } from '../utils/autoSync.js';
import { socket } from './socket.js'
import {
    iframe,
    playerReady,
    setPlayerReady
} from '../player/player.js';
import { roomId } from "../client.js";

socket.on('exitRoom', () => {
    exitRoomUI()
    stopSync()
    Object.assign(clientState, {
        videoUrl: null,
        currentTime: 0,
        isPlaying: false,
        isLeader: false
    })
    safePostMessage({ type: "player:pause", data: {} })
})

socket.on('sync-event', (data) => {
    const { isPlaying, videoUrl, currentTime } = data
    let diff = Math.abs(currentTime - clientState.currentTime)
    if (diff > 0.5 && playerReady) {
        safePostMessage({ type: "player:setCurrentTime", data: { time: currentTime } })
    }
    if (isPlaying !== clientState.isPlaying && playerReady) {
        safePostMessage({
            type: isPlaying ? "player:play" : "player:pause",
            data: {}
        })
    }
    if (iframe && videoUrl && videoUrl !== clientState.videoUrl) {
        setPlayerReady(false)
        iframe.src = videoUrl;
    }
    Object.assign(clientState, {
        currentTime: currentTime,
        videoUrl: videoUrl,
        isPlaying: isPlaying
    })
    autoSync(clientState.isLeader, clientState.isPlaying);
});

socket.on('room-joined', (data) => {
    clientState.isLeader = (data.role === 'leader');
    Object.assign(clientState, {
        currentTime: data.currentTime,
        videoUrl: data.videoUrl,
        isPlaying: data.isPlaying,
    });
    joinRoomUI(data, clientState)
    autoSync(clientState.isLeader, clientState.isPlaying);
})

socket.on('sync-time', (data) => {
    const { currentTime } = data
    const diff = Math.abs(currentTime - clientState.currentTime);
    if (diff > 0.5 && playerReady) {
        safePostMessage({ type: "player:setCurrentTime", data: { time: currentTime + 0.5 } })
    }
})


// update online users
socket.on('online-update', (data) => {
    updateOnlineUI(data)
});


socket.on('chat-message', (data) => {
    chatMessageUI(data)
})

socket.off('users-list');
socket.on('users-list', (users) => {
    userList(users)
});

socket.on('connect', () => {
    if (roomId) {
        socket.emit('join-room', roomId)
    }
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Отключено';
});
