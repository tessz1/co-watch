const $ = (id) => document.getElementById(id)

export async function createRoom() {
    const roomName = $('modal-room').value.trim()
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