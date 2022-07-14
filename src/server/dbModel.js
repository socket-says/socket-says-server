'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const newPlayer = new Schema({
  Username: {
    type: String,
    require: true,
    unique: true,
  },
  Password: {
    type: String,
    require: true,
  },
  Highscore: {
    type: Number,
    require: false,
  },
});

const playerModel = mongoose.model('player', newPlayer);

module.exports = playerModel;