
const socket = io();
let timerVideo = 0
let syncInterval = null;
let isPlaying = false;
const statusDiv = document.getElementById('status');
document.getElementById('playBtn').onclick = () => {
    socket.emit('sync-event', { type: 'play' });
    isPlaying = true;
    autoSync(isLeader, true);
    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:play", data: {} }),
        "*"
    );
};

// modal window
document.getElementById("ghost-btn").onclick = () => {
    document.getElementById("modal-overlay").classList.add('active')
}

document.getElementById('modal-close').onclick = () => {
    document.getElementById("modal-overlay").classList.remove('active')
}

document.getElementById('save-btn').onclick = () => {
    const nameRoom = document.getElementById('modal-room').value
    if (nameRoom.length === 0 || !nameRoom.trim()) {
        alert('Введите название комнаты');
        return;
    }
    socket.emit('join-room', nameRoom);
    document.getElementById('modal-room').value = ''
};



document.getElementById('stopBtn').onclick = () => {
    isPlaying = false
    autoSync(isLeader, false);
    socket.emit('sync-event', { type: 'pause' })
    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:pause", data: {} }),
        "*"
    )
};
document.getElementById('syncBtn').onclick = () => {
    socket.emit('sync-event', { type: 'seek', time: timerVideo })
    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:setCurrentTime", data: { time: timerVideo + 0.5 } }),
        "*"
    );
}

socket.on('sync-event', (data) => {
    if (data.type === 'seek') {
        const iframe = document.getElementById('rutube-player');
        iframe.contentWindow.postMessage(JSON.stringify({ type: "player:setCurrentTime", data: { time: data.time } }), "*");
    }
    if (data.type === 'pause') {
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


window.addEventListener("message", function (event) {
    try {
        const message = JSON.parse(event.data)
        if (message.type === 'player:currentTime') {
            timerVideo = message.data.currentTime
        }
    } catch (event) { }
})


setInterval(() => {
    socket.emit('my-time', { currentTime: timerVideo });
}, 2000);

socket.on('remote-time', (data) => {
    document.getElementById('remoteTime').textContent = `Время партнера ${formatTime(data.currentTime)}`;
    document.getElementById('myTime').textContent = `Мое время ${formatTime(timerVideo)}`
});

function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

let currentRoom = null;
let isLeader = false;
socket.on('room-joined', (data) => {
    isLeader = (data.role === 'leader');
    document.getElementById('room-code').textContent = data.roomName;
    document.getElementById('role').textContent = isLeader ? '👑 Ведущий' : '👀 Зритель';
    document.getElementById('online-users').textContent = data.size
    autoSync(isLeader, isPlaying);
})
socket.on('online-update', (data) => {
    document.getElementById('online-users').textContent = data.size;
});
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
            socket.emit('sync-time', { type: 'seek', time: timerVideo })
        }, 5000)
    }
}
socket.on('online-update', (data) => {
    document.getElementById('online-users').textContent = data.size;
});
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





socket.on('connect', () => {
    // statusDiv.textContent = 'Подключено! ID: ' + socket.id;
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Отключено';
});
console.log(timerVideo)