export const iframe = document.getElementById('rutube-player');
export let playerReady = false;
if (iframe) {
    iframe.onload = () => {
        setTimeout(() => {
            playerReady = true;
        }, 1000);
    };
}
export function setPlayerReady(value) {
    playerReady = value;
}