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

    let { Username, Password, Highscore } = req.body;
    let player = {
      Username: Username,
      Password: Password,
      Highscore: Highscore,
    };
    let playerData = await PlayerData.create(player);
    console.log(player, playerData);
    //allPlayers.forEach(async element => {
    // if (element.Username === username) {
    //   // if username is existing, compare the password, if password is bad, re-prompt for username and password
    // } else { // if username is new, hash the password and POST the player
    // let player = {
    //   Username: username,
    //   Password: password,
    //   Highscore: null,
    // };
    // player.Password = await bcrypt.hash(player.Password, 10);
    // let response = await PlayerData.create(player);
    res.status(200).send(playerData);
    //   }
    // });
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

app.listen(DBPORT, () => console.log(`Listening on PORT ${DBPORT}`));
//---------------DB--------------------


const { Server } = require('socket.io');
const PORT = process.env.PORT || 3002;
const chalk = require('chalk');
const server = new Server(PORT);

const socketSays = server.of('/socket-says');

socketSays.on('connection', (socket) => {
  console.log('Socket connected to Event Server', socket.id);
  let currentPlayer = 'guest';
  socketSays.emit('LOG_IN');

  socket.on('CHECK_USERNAME', async (payload) => {
    let { Username } = payload.user;
    try {
      let player = await PlayerData.findOne({ Username });
      if (player !== null) {
        currentPlayer = player;
        socketSays.emit('PLAYER_EXISTS', payload);
      } else if (player === null) {
        socketSays.emit('NEW_PLAYER', payload);
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
        socketSays.emit('HANDOFF', payload);
      }
    } catch (e) {
      console.log(e.message);
    }
  });

  socket.on('CREATE', async (payload) => {
    let { Username, Password, Highscore } = payload.user;
    let newPlayer = await PlayerData.create({ Username, Password, Highscore });
    // console.log('newPlayer: ', newPlayer);
    socketSays.emit('CREATED_NEW', payload);
  });

  socket.on('AUTHENTICATED', (payload) => {
    console.log('joined the room');
    socket.join(payload.user.Username);
    // console.log('authenticated payload', payload);
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
