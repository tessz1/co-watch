import { prisma } from '../db/prisma.js';

export async function createRoom(req, res) {
    try {
        const { name } = req.body;

        const room = await prisma.room.create({
            data: { name }
        });

        res.json({
            roomId: room.id,
            name: room.name
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}
export async function getRoom(req, res) {
    try {
        const room = await prisma.room.findUnique({
            where: { id: req.params.id }
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({
            roomId: room.id,
            name: room.name
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}