
const socket = io();
let syncInterval = null;
let isLeader = false;
let clientState = {
    videoUrl: null,
    currentTime: 0,
    isPlaying: false
}
const roomId = window.location.pathname.split('/').pop();
const statusDiv = document.getElementById('status');
const iframe = document.getElementById('rutube-player');

document.getElementById('playBtn').onclick = async () => {
    clientState.isPlaying = true
    socket.emit('sync-event', { roomId, type: 'play', time: clientState.currentTime });
    autoSync(isLeader, clientState.isPlaying);
};

document.getElementById('danger-btn').onclick = () => {
    socket.emit('exitRoom')
}

socket.on('exitRoom', () => {
    document.getElementById('room-code').textContent = '— — —';
    document.getElementById('role').textContent = 'Вне комнаты';
    document.getElementById('online-users').textContent = '0'
    document.getElementById('roomCode').textContent = 'Вне комнаты'
    const chat = document.getElementById('chatContainer');
    chat.classList.remove('unlocked')
    chat.classList.add('chat-locked');
    document.querySelectorAll('.user-item').forEach(el => el.remove());
    document.getElementById('chat-overlay').classList.add('overlay-locked');
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    isLeader = false;
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:pause", data: {} }),
        "*"
    );
})


// modal window
document.getElementById("ghost-btn").onclick = () => {
    document.getElementById("modal-overlay").classList.add('active')
}

document.getElementById('modal-close').onclick = () => {
    document.getElementById("modal-overlay").classList.remove('active')
}

document.getElementById('stopBtn').onclick = () => {
    clientState.isPlaying = false
    socket.emit('sync-event', { roomId, type: 'pause', time: clientState.currentTime })
    autoSync(isLeader, clientState.isPlaying)
};
document.getElementById('syncBtn').onclick = () => {
    socket.emit('sync-event', { roomId, type: 'seek', time: clientState.currentTime })
}

document.getElementById('chatSend').onclick = () => {
    const inputChat = document.getElementById('chatInput').value;
    if (!inputChat || inputChat.trim().length <= 0) return
    socket.emit('chat-message', inputChat);
    document.getElementById('chatInput').value = '';
}

socket.on('sync-event', (data) => {
    const { isPlaying, videoUrl, currentTime } = data
    let diff = Math.abs(currentTime - clientState.currentTime)
    if (diff > 0.5) {
        iframe.contentWindow.postMessage(JSON.stringify({ type: "player:setCurrentTime", data: { time: currentTime } }), "*");
    }
    if (isPlaying !== clientState.isPlaying) {
        clientState.isPlaying = isPlaying;

        iframe.contentWindow.postMessage(
            JSON.stringify({
                type: isPlaying ? "player:play" : "player:pause",
                data: {}
            }),
            "*"
        );
    }
    if (videoUrl !== clientState.videoUrl) {
        iframe.src = videoUrl
    }
    clientState = { videoUrl, currentTime, isPlaying }
    autoSync(isLeader, clientState.isPlaying);
});
// document.getElementById('loadVideoBtn').onclick = () => {
//     let url = document.getElementById('videoUrl').value.trim();
//     if (!url) return;
//     const iframe = document.getElementById('rutube-player');
//     if (url.includes('rutube.ru/video/')) {
//         const match = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
//         if (match && match[1]) {
//             url = `https://rutube.ru/play/embed/${match[1]}`;
//         }
//     }
//     iframe.src = url;
//     socket.emit('sync-event', { type: 'load-video', url: url });
//     timerVideo = 0;
//     isPlaying = false;
//     autoSync(isLeader, false);
// };


document.getElementById('save-btn').onclick = async () => {
    await createRoom()
};


window.addEventListener("message", function (event) {
    try {
        const message = JSON.parse(event.data)
        if (message.type === 'player:currentTime') {
            clientState.currentTime = message.data.currentTime
        }
    } catch (event) { }
})


function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

socket.on('room-joined', (data) => {
    isLeader = (data.role === 'leader');
    document.getElementById('room-code').textContent = data.name;
    document.getElementById('role').textContent = isLeader ? '👑 Ведущий' : '👀 Зритель';
    document.getElementById('online-users').textContent = data.size
    document.getElementById('roomCode').textContent = data.roomName
    autoSync(isLeader, clientState.isPlaying);
})

socket.on('online-update', (data) => {
    document.getElementById('online-users').textContent = data.size;
    document.getElementById('onlineCount').textContent = data.size;
});


socket.on('chat-message', (data) => {
    const { message, name, time } = data;
    const container = document.getElementById('chatMessages');
    const input = document.getElementById('chat-input')
    const messageItem = document.createElement('div');
    messageItem.className = 'message';
    messageItem.innerHTML = `
           <div class="avatar"></div>
           <div>
               <span class="user">${name}</span>
               <span class="text">${message}</span>
           </div>
           <span class="time">${time}</span>
    `
    container.appendChild(messageItem)
})

socket.off('users-list');
socket.on('users-list', (users) => {
    const container = document.getElementById('users-list');
    container.innerHTML = '';

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';

        userItem.innerHTML = `
            <div class="avatar user-for-list"></div>
            <div class="style-users">
                <span class="user-list">${user.name}</span>
            </div>
            <span class="user-state watch">Смотрит</span>
        `;

        container.appendChild(userItem);
    });

    const header = document.querySelector('.users-header');
    if (header) {
        header.textContent = `Участники: ${users.length}`;
    }
});


function autoSync(isLeader, isPlaying) {
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

socket.on('sync-time', (data) => {
    const { currentTime } = data
    const diff = Math.abs(currentTime - clientState.currentTime);
    if (diff > 0.5) {
        iframe.contentWindow.postMessage(
            JSON.stringify({ type: "player:setCurrentTime", data: { time: currentTime + 0.5 } }),
            "*"
        );
    }
})


async function createRoom() {
    const roomName = document.getElementById('modal-room').value.trim()
    const res = await fetch('/api/room', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            name: roomName
        })

    })
    const data = await res.json()
    window.location = `/room/${data.roomId}`
}



async function getRoomName(roomID) {
    const res = await fetch(`api/room/${roomID}`)
    const data = await res.json()
    return data
}



document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active') })
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'))

        if (tab.textContent.trim() === 'Комната') {
            document.getElementById('tab-room').classList.add('active');
        } else if (tab.textContent.trim() === 'Видео') {
            document.getElementById('tab-video').classList.add('active');
        } else if (tab.textContent.trim() === 'Настройки') {
            document.getElementById('tab-settings').classList.add('active');
        }
    })
})

socket.on('connect', () => {
    if (roomId) {
        socket.emit('join-room', roomId)
    }
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Отключено';
});