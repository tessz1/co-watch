
const socket = io();
let timerVideo = 0
let syncInterval = null;
let isLeader = false;
const roomId = window.location.pathname.split('/').pop();
let isPlaying = false;
const statusDiv = document.getElementById('status');


document.getElementById('playBtn').onclick = async () => {
    socket.emit('sync-event', { roomId, type: 'play', time: timerVideo });
    isPlaying = true;
    autoSync(isLeader, true);

    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:play", data: {} }),
        "*"
    );
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
    isPlaying = false;
    isLeader = false;
    const iframe = document.getElementById('rutube-player');
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
    isPlaying = false
    autoSync(isLeader, false);
    socket.emit('sync-event', { roomId, type: 'pause', time: timerVideo })
    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:pause", data: {} }),
        "*"
    )
};
document.getElementById('syncBtn').onclick = () => {
    socket.emit('sync-event', { roomId, type: 'seek', time: timerVideo })
    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:setCurrentTime", data: { time: timerVideo + 0.5 } }),
        "*"
    );
}

document.getElementById('chatSend').onclick = () => {
    const inputChat = document.getElementById('chatInput').value;
    if (!inputChat || inputChat.trim().length <= 0) return
    socket.emit('chat-message', inputChat);
    document.getElementById('chatInput').value = '';
}

socket.on('sync-event', (data) => {
    if (data.type === 'seek') {
        const iframe = document.getElementById('rutube-player');
        iframe.contentWindow.postMessage(JSON.stringify({ type: "player:setCurrentTime", data: { time: data.time } }), "*");
    }
    if (data === 'pause') {
        const iframe = document.getElementById('rutube-player');
        iframe.contentWindow.postMessage(
            JSON.stringify({ type: "player:pause", data: {} }),
            "*"
        );
    }
    if (data.type === 'play') {
        const iframe = document.getElementById('rutube-player');
        iframe.contentWindow.postMessage(
            JSON.stringify({ type: "player:play", data: {} }),
            "*"
        );
    }
    if (data.type === 'load-video') {
        const iframe = document.getElementById('rutube-player');
        iframe.src = data.url;
        timerVideo = 0;
        isPlaying = false;
        autoSync(false, false);
    }
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
    // const roomName = document.getElementById('modal-room').value;
    // const videoUrl = document.getElementById('modal-link').value;
    // if (roomName && roomName.trim()) {
    //     const chat = document.getElementById('chatContainer');
    //     chat.classList.add('unlocked');
    //     chat.classList.remove('chat-locked');
    //     setTimeout(() => {
    //         document.getElementById('chat-overlay').classList.remove('overlay-locked');
    //     }, 350);
    //     document.getElementById('modal-room').value = '';
    // }
    // if (videoUrl && videoUrl.trim()) {
    //     let url = videoUrl.trim();

    //     if (url.includes('rutube.ru/video/')) {
    //         const match = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
    //         if (match && match[1]) {
    //             url = `https://rutube.ru/play/embed/${match[1]}`;
    //         }
    //     }
    //     const iframe = document.getElementById('rutube-player');
    //     iframe.src = url;
    //     socket.emit('sync-event', { type: 'load-video', url: url });
    //     timerVideo = 0;
    //     isPlaying = false;
    //     autoSync(isLeader, false);

    //     document.getElementById('modal-link').value = '';
    // }
    // document.getElementById("modal-overlay").classList.remove('active');
};


window.addEventListener("message", function (event) {
    try {
        const message = JSON.parse(event.data)
        if (message.type === 'player:currentTime') {
            timerVideo = message.data.currentTime
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
    autoSync(isLeader, isPlaying);
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
            socket.emit('sync-time', { roomId, type: 'seek', time: timerVideo, isPlaying })
        }, 5000)
    }
}

socket.on('sync-time', (data) => {
    const diff = Math.abs(data.time - timerVideo);
    if (diff > 0.5) {
        const iframe = document.getElementById('rutube-player');
        iframe.contentWindow.postMessage(
            JSON.stringify({ type: "player:setCurrentTime", data: { time: data.time + 0.5 } }),
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
console.log(timerVideo)