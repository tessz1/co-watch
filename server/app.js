import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRoom, getRoom } from './controllers/room.controllers.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.post('/api/room', createRoom);
app.get('/api/room/:id', getRoom);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/room/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;