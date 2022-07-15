'use strict';

require('dotenv').config();
// app.use(express.json());
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.connect('mongodb+srv://schillerandrew:q0FOvKzs7VNXJVsC@cluster-socket-says.pnfju.mongodb.net/?retryWrites=true&w=majority');
const PlayerData = require('../src/server/dbModel');
const DBPORT = process.env.DBPORT || 3004;

const server = require('../src/server');
const socket = require('../src/server');
const supertest = require('supertest');
const mockRequest = supertest(server);

describe('CRUD Tests', () => {

  test('Successfully creates new player', async () => {
    let player = await mockRequest.create({
      Username: 'teddy',
      Password: 'Password',
      HighScore: 99,
    });
    console.log(player);
    expect(player.Username).toEqual('teddy');
  });

});