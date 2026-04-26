
let timerVideo = 0
const socket = io();
const statusDiv = document.getElementById('status');
document.getElementById('playBtn').onclick = () => {
    socket.emit('sync-event', { type: 'play' });

    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:play", data: {} }),
        "*"
    );
};

document.getElementById('stopBtn').onclick = () => {
    socket.emit('sync-event', { type: 'pause' })
    const iframe = document.getElementById('rutube-player');
    iframe.contentWindow.postMessage(
        JSON.stringify({ type: "player:pause", data: {} }),
        "*"
    )
};
document.getElementById('syncBtn').onclick = () => {
    console.log(timerVideo)
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
});
document.getElementById('loadVideoBtn').onclick = () => {
    let url = document.getElementById('videoUrl').value.trim();
    if (!url) return;

    const iframe = document.getElementById('rutube-player');
    if (url.includes('rutube.ru/video/')) {
        const match = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
        if (match && match[1]) {
            url = `https://rutube.ru/play/embed/${match[1]}`;
        }
    }
    iframe.src = url;
    timerVideo = 0;
};


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
socket.on('connect', () => {
    statusDiv.textContent = 'Подключено! ID: ' + socket.id;
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Отключено';
});
console.log(timerVideo)