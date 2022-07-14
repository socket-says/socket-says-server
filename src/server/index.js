'use strict';

//---------------DB--------------------

require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL);
const PlayerData = require('./dbModel');
const DBPORT = process.env.DBPORT || 3004;

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', function () {
  console.log('Mongoose is connected');
});

app.get('/', (req, res) => {
  console.log('Welcome to the \'Socket-says\' server');
});

app.get('*', (req, res) => {
  res.status(404).send('Not available');
});

app.use((error, req, res, next) => {
  res.status(500).send(error.message);
});

app.listen(DBPORT, () => console.log(`Listening on PORT ${DBPORT}`));

//---------------DB--------------------

//-------------Socket Server ---------------

const { Server } = require('socket.io');
const PORT = process.env.PORT || 3002;
const server = new Server(PORT);

const socketSays = server.of('/socket-says');

socketSays.on('connection', (socket) => {
  console.log('Socket connected to Event Server', socket.id);
  socketSays.emit('LOG_IN');

  socket.on('CHECK_USERNAME', async (payload) => {
    console.log('server received check db');
    let { Username } = payload.user;
    try {
      let player = await PlayerData.findOne({ Username });
      console.log('player: ', player);
      if (player !== null) {
        socketSays.emit('PLAYER_EXISTS', payload);
      } else if (player === null) {
        socketSays.emit('NEW_PLAYER', payload);
      }
    } catch (e) {
      console.log(e.message);
    }
  });

  socket.on('CREATE', async (payload) => {
    let { Username, Password, Highscore } = payload.user;
    let newPlayer = await PlayerData.create({ Username, Password, Highscore });
    console.log('newPlayer: ', newPlayer);
    socketSays.emit('CREATED_NEW', payload);
  });

  socket.on('AUTHENTICATED', (payload) => {
    console.log('joined the room');
    socket.join(payload.user.Username);
    console.log('authenticated payload', payload);
    socketSays.emit('MAIN', payload);
  });

  socket.on('PLAY_GAME', (payload) => {
    socketSays.emit('START', payload);
  });

  socket.on('CORRECT', (payload) => {
    console.log('server received correct');
    socketSays.emit('NEXT_SEQUENCE', payload);
  });

  socket.on('INCORRECT', (payload) => {
    socketSays.emit('LOST', payload);
  });

  socket.on('VIEW_HIGH_SCORES', (payload) => {
    socketSays.emit('DISPLAY_HIGH_SCORES', payload);
  });

  socket.on('RETURN_TO_MAIN', (payload) => {
    socketSays.emit('MAIN', payload);
  });

});
