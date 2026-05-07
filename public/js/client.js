
import { clientState } from "./storage/storage.js";
import { safePostMessage } from "./helper/helper.js";
import { autoSync, syncInterval, stopSync } from '../js/utils/autoSync.js'
import { exitRoomUI, updateOnlineUI, joinRoomUI, chatMessageUI, userList } from "./utils/updateUI.js";
import { bindMenuControls } from './ui/ui.js'
const socket = io();
const roomId = window.location.pathname.split('/').pop();
const statusDiv = document.getElementById('status');
const iframe = document.getElementById('rutube-player');
let playerReady = false;
if (iframe) {
    iframe.onload = () => {
        setTimeout(() => {
            playerReady = true;
        }, 1000);
    };
}
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
        playerReady = false;
        iframe.src = videoUrl;
    }
    Object.assign(clientState, {
        currentTime: currentTime,
        videoUrl: videoUrl,
        isPlaying: isPlaying
    })
    autoSync(clientState.isLeader, clientState.isPlaying);
});

window.addEventListener("message", (event) => {
    if (typeof event.data !== 'string') return;
    try {
        const message = JSON.parse(event.data);
        if (message.type === 'player:currentTime') {
            clientState.currentTime = message.data.currentTime;
        }
    } catch { }
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


socket.on('sync-time', (data) => {
    const { currentTime } = data
    const diff = Math.abs(currentTime - clientState.currentTime);
    if (diff > 0.5 && playerReady) {
        safePostMessage({ type: "player:setCurrentTime", data: { time: currentTime + 0.5 } })
    }
})


async function getRoomName(roomID) {
    const res = await fetch(`/api/room/${roomID}`)
    const data = await res.json()
    return data
}

bindMenuControls()

socket.on('connect', () => {
    if (roomId) {
        socket.emit('join-room', roomId)
    }
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Отключено';
});


window.onerror = function (message, source, lineno, colno, error) {
    console.log({
        message,
        source,
        lineno,
        colno,
        error
    });
};

window.addEventListener('unhandledrejection', (event) => {
    console.log('Unhandled promise rejection:', event.reason);
});