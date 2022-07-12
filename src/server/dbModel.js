'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const newPlayer = new mongoose.Schema({
  Username: {
    type: String,
    req: true,
  },
  Password: {
    type: String,
    req: true,
  },
  HighScore: {
    type: Array, // is array sufficient to handle multiple high scores from same user?
    req: false,
  }
});

const playerModel = mongoose.model('player', newPlayer);

module.exports = playerModel;