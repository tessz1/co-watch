import { $ } from '../helper/helper.js'
export function exitRoomUI() {
    $('room-code').textContent = '— — —';
    $('role').textContent = 'Вне комнаты';
    $('online-users').textContent = '0'
    $('roomCode').textContent = 'Вне комнаты'
    const chat = $('chatContainer');
    chat.classList.remove('unlocked')
    chat.classList.add('chat-locked');
    document.querySelectorAll('.user-item').forEach(el => el.remove());
    $('chat-overlay').classList.add('overlay-locked');
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
}

export function joinRoomUI(data, clientState) {
    $('room-code').textContent = data.name;
    $('role').textContent = clientState.isLeader ? '👑 Ведущий' : '👀 Зритель';
    $('online-users').textContent = data.size
    $('roomCode').textContent = data.roomName
}

export function updateOnlineUI(data) {
    $('online-users').textContent = data.size;
    $('onlineCount').textContent = data.size;
}

export function chatMessageUI(data) {
    const { message, name, time } = data;
    const container = $('chatMessages');
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
}


export function userList(users) {
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
}