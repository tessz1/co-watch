
import { clientState } from "./storage/storage.js";
import { bindMenuControls } from './ui/ui.js'
import './socket/events.js'

export const roomId = window.location.pathname.split('/').pop();

window.addEventListener("message", (event) => {
    if (typeof event.data !== 'string') return;
    try {
        const message = JSON.parse(event.data);
        if (message.type === 'player:currentTime') {
            clientState.currentTime = message.data.currentTime;
        }
    } catch { }
});


async function getRoomName(roomID) {
    const res = await fetch(`/api/room/${roomID}`)
    const data = await res.json()
    return data
}

bindMenuControls()


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