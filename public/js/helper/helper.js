export function safePostMessage(message) {
    const iframe = document.getElementById('rutube-player');
    if (!iframe) return;
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
        JSON.stringify(message),
        "*"
    );
}

export const $ = (id) => document.getElementById(id)
export const $$ = (id) => document.querySelectorAll(id)