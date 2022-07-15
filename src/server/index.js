'use strict';

//---------------DB--------------------

require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
  console.log(`${socket.id} joined the ${socket.id} room`);
  socket.join(socket.id);
  socketSays.to(socket.id).emit('LOG_IN', socket.id);

  socket.on('CHECK_USERNAME', async (payload) => {
    let { Username } = payload.user;
    try {
      let player = await PlayerData.findOne({ Username });
      console.log('checked username payload: ', payload);
      if (player !== null) {
        socketSays.to(payload.user.socketId).emit('PLAYER_EXISTS', payload);
      } else if (player === null) {
        socketSays.to(payload.user.socketId).emit('NEW_PLAYER', payload);
      }
    } catch (e) {
      console.log(e.message);
    }
  });

  socket.on('CHECK_PASSWORD', async (payload) => {
    let { Username } = payload.user;
    try {
      let foundUser = await PlayerData.findOne({ Username });
      let valid = await bcrypt.compare(payload.user.Password, foundUser.Password);
      if (valid) {
        socketSays.to(payload.user.socketId).emit('HANDOFF', payload);
      }
    } catch (e) {
      console.log(e.message);
    }
  });

  socket.on('CREATE', async (payload) => {
    let { Username, Password, Highscore } = payload.user;
    await PlayerData.create({ Username, Password, Highscore });
    socketSays.to(payload.user.socketId).emit('CREATED_NEW', payload);
  });

  socket.on('AUTHENTICATED', (payload) => {
    socketSays.to(payload.user.socketId).emit('MAIN', payload);
    socketSays.emit('PLAYER_JOINED', payload);
  });

  socket.on('RETURN_TO_MAIN', (payload) => {
    socketSays.to(payload.user.socketId).emit('MAIN', payload);
  });

  socket.on('PLAY_GAME', (payload) => {
    socketSays.to(payload.user.socketId).emit('START', payload);
  });

  socket.on('VIEW_HIGH_SCORES', (payload) => {
    socketSays.to(payload.user.socketId).emit('DISPLAY_HIGH_SCORES', payload);
  });

  socket.on('CORRECT', (payload) => {
    socketSays.to(payload.user.socketId).emit('NEXT_SEQUENCE', payload);
    socketSays.emit('PLAYER_WON', payload);
  });
  socket.on('INCORRECT', (payload) => {
    socketSays.to(payload.user.socketId).emit('LOST', payload);
    socketSays.emit('PLAYER_LOST', payload);
  });

});

module.exports = {
  server,
  socketSays,
};

