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

  socket.on('JOIN', (room) => {
    console.log('joined the room');
    socket.join(room);
    socketSays.emit('LOG_IN');
  });

  socket.on('LOGGED_IN', (payload) => {
    socketSays.emit('MAIN', payload);
  });

  socket.on('CHECK_DB', async (payload) => {
    console.log('server received check db');
    let username = payload.username;
    console.log(username);
    try {
      let player = await PlayerData.findOne({ Username: username });
      console.log('player:', player);
    } catch (payload) {
      console.log(payload);
      let newPlayer = await PlayerData.create({ payload });
      console.log('new player created', newPlayer);
    }
    socketSays.emit('CHECKED_DB');
  });

  // app.get('/playerData', async function getPlayerData(req, res, next) {
  //   let id = payload.username;
  //   let player;
  //   try {
  //     player = await PlayerData.findById(id);
  //     console.log('got player by id');
  //     res.status(200).send(player);
  //   } catch (e) {
  //     console.error(e);
  //     res.status(500).send('server error');
  //   }
  //   if (!player) {
  //     player = await PlayerData.create(
  //       {
  //         Username: payload.username,
  //         Password: payload.password,
  //         Highscore: 0,
  //       });
  //     player.Password = await bcrypt.hash(player.Password, 10);
  //     let response = await PlayerData.create(player);
  //     res.status(200).send(response);
  //   }

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
