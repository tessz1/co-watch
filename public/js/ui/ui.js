import { autoSync } from '../utils/autoSync.js'
import { createRoom } from '../utils/createRoom.js'
import { $, $$ } from '../helper/helper.js'
export function bindUI(socket, state) {
    bindChatControls(socket)
    bindPlayerControls(socket, state)
}


function bindPlayerControls(socket, state) {
    $("ghost-btn").onclick = () => {
        $("modal-overlay").classList.add('active')
    }

    $('modal-close').onclick = () => {
        $("modal-overlay").classList.remove('active')
    }

    $('stopBtn').onclick = () => {
        state.isPlaying = false
        socket.emit('sync-event', { type: 'pause', time: state.currentTime })
        autoSync(state.isLeader, state.isPlaying)
    };
    $('syncBtn').onclick = () => {
        socket.emit('sync-event', { type: 'seek', time: state.currentTime })
    }

    $('playBtn').onclick = async () => {
        state.isPlaying = true
        socket.emit('sync-event', { type: 'play', time: state.currentTime });
        autoSync(state.isLeader, state.isPlaying);
    };

    $('danger-btn').onclick = () => {
        socket.emit('exitRoom')
    }

    $('save-btn').onclick = () => {
        let url = $('modal-link').value.trim();
        if (!url) return;

        if (url.includes('rutube.ru/video/')) {
            const match = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
            if (match && match[1]) {
                url = `https://rutube.ru/play/embed/${match[1]}`;
            }
        }
        const iframe = $('rutube-player');
        iframe.src = url;
        socket.emit('sync-event', { type: 'load-video', url: url });
        Object.assign(state, {
            currentTime: 0,
            videoUrl: url,
            isPlaying: false
        });
        autoSync(state.isLeader, state.isPlaying);
    };

    $('create-room-btn').onclick = async () => {
        await createRoom()
    };
}


function bindChatControls(socket) {
    $('chatSend').onclick = () => {
        const inputChat = $('chatInput').value;
        if (!inputChat || inputChat.trim().length <= 0) return
        socket.emit('chat-message', inputChat);
        $('chatInput').value = '';
    }
}


export function bindMenuControls() {
    console.log($('tab-room'))
    $$('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.tab').forEach(t => { t.classList.remove('active') })
            tab.classList.add('active');
            $$('.tab-content').forEach(content => content.classList.remove('active'))

            if (tab.textContent.trim() === 'Комната') {
                $('tab-room').classList.add('active');
            } else if (tab.textContent.trim() === 'Видео') {
                $('tab-video').classList.add('active');
            } else if (tab.textContent.trim() === 'Настройки') {
                $('tab-settings').classList.add('active');
            }
        })
    })
}
