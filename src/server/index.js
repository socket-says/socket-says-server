'use strict';

//---------------DB--------------------
require('dotenv').config();
const express = require('express');
// const cors = require('cors');
const app = express();
// app.use(cors());
app.use(express.json());
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.connect(process.env.DB_URL);
const PlayerData = require('./dbModel');
// const authenticatePlayer = require('../auth/basicAuth');
const dbPORT = process.env.PORT || 3001;

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', function () {
  console.log('Mongoose is connected');
});

//Routes
app.get('/playerData', getPlayerData);
app.post('/playerData', postPlayerData);
// app.post('/basicAuth', authenticatePlayer);

async function getPlayerData(req, res, next) {
  try {
    let allPlayers = await PlayerData.find();
    res.status(200).send(allPlayers);
  } catch (e) {
    console.error(e);
    res.status(500).send('server error');
  }
}

async function postPlayerData(req, res, next) {
  try {
    // whenever username/password is provided, must READ all players in database, to see if username is new or existing
    
    
    let username = 'apple';
    let password = 'andrew';
    let allPlayers = await PlayerData.find();
    allPlayers.forEach (async element => {
      if (element.Username === username) {
        // if username is existing, compare the password, if password is bad, re-prompt for username and password
      } else { // if username is new, hash the password and POST the player
        let player = {
          Username: username,
          Password: password,
          Highscore: null,
        };
        player.Password = await bcrypt.hash(player.Password, 10);
        let response = await PlayerData.create(player);
        res.status(200).send(response);
      }
    });
    // console.log(allPlayers);
  } catch (err) {
    next(err);
  }
}

app.get('*', (req, res) => {
  res.status(404).send('Not available');
});

app.use((error, req, res, next) => {
  res.status(500).send(error.message);
});

app.listen(dbPORT, () => console.log(`Listening on PORT ${dbPORT}`));
//---------------DB--------------------


const { Server } = require('socket.io');
const PORT = process.env.PORT || 3002;
const chalk = require('chalk');
const server = new Server(PORT);
require('dotenv').config();

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
