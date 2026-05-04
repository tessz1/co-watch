import express from 'express';
import path from 'path';
import { createRoom, getRoom } from './controllers/room.controllers.js';

const app = express();

app.use(express.json());


app.post('/api/room', createRoom);
app.get('/api/room/:id', getRoom);


app.use(express.static('public'));

app.get('/room/:id', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
});

export default app;