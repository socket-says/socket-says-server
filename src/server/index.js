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
    let { Username } = payload.user;
    try {
      let player = await PlayerData.findOne({ Username });
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
    socketSays.emit('CREATED_NEW', payload);
  });

  socket.on('AUTHENTICATED', (payload) => {
    console.log('joined the room');
    socket.join(payload.user.Username);
    socketSays.emit('MAIN', payload);
  });
    // takes in payload, defines player-specific room, joins the socket to that room, emits MAIN with player-specific payload:
    let clientRoom = payload.user.Username;
    console.log(`${clientRoom} joined the ${clientRoom} room`);
    socket.join(clientRoom);
    console.log('Authenticated payload', payload);
    socketSays.to(clientRoom).emit('MAIN', payload);
  });

  socket.on('CORRECT', (payload) => {
    socketSays.emit('NEXT_SEQUENCE', payload);
  });

  socket.on('PLAY_GAME', (payload) => {
    // takes in player-specific payload
    // emits START to that player's room, with player-specific payload
    socketSays.to(payload.user.Username).emit('START', payload);
  });

  socket.on('VIEW_HIGH_SCORES', (payload) => {
    socketSays.to(payload.user.Username).emit('DISPLAY_HIGH_SCORES', payload);
  });

  socket.on('CORRECT', (payload) => {
    // takes in player-specific payload
    // emits NEXT_SEQUENCE to that player's room, with player-specific payload
    // console.log('server received correct');
    socketSays.to(payload.user.Username).emit('NEXT_SEQUENCE', payload);
  });
  socket.on('INCORRECT', (payload) => {
    // takes in player-specific payload
    // emits NEXT_SEQUENCE to that player's room, with player-specific payload
    socketSays.to(payload.user.Username).emit('LOST', payload);
  });
  
});
