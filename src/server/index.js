'use strict';

//---------------DB--------------------

// const express = require('express');
// const app = express();
// app.use(express.json());
// const mongoose = require('mongoose');
// mongoose.connect(process.env.DB_URL);
// const PlayerData = require('./dbModel');

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'Connection error'));
// db.once('open', function () {
//   console.log('Mongoose is connected');
// });

//Routes
// app.get('/playerData', getPlayerData);
// app.post('/playerData', postPlayerData);

// async function getPlayerData(req, res, next) {
//   try {
//     let allPlayers = await PlayerData.readAll();
//     res.status(200).send(allPlayers);
//   } catch (e) {
//     console.error(e);
//     res.status(500).send('server error');
//   }
// };

// async function postPlayerData(req, res, next) {
//   try {
//     let player = req.body;
//     let response = await PlayerData.create(player);
//     res.status(200).send(response);
//   } catch (err) {
//     next(err);
//   }
// };

// app.get('*', (req, res) => {
//   res.status(404).send('Not available');
// });

// app.use((error, req, res, next) => {
//   res.status(500).send(error.message);
// });

// app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

//---------------DB--------------------

const { Server } = require('socket.io');
const PORT = process.env.PORT || 3002;
const chalk = require('chalk');
const server = new Server(PORT);
require('dotenv').config();
// const { displayMain } = require('./handleLogin');

const socketSays = server.of('/socket-says');

socketSays.on('connection', (socket) => {
  console.log('Socket connected to Event Server', socket.id);

  socket.on('JOIN', (room) => {
    console.log('joined the room');
    socket.join(room);
    socketSays.emit('LOG_IN');
  });

  socket.on('LOGGED_IN', (payload) => {
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

});

// app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));