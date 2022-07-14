'use strict';

const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = require('../src/server');
const Client = require("socket.io-client");

describe("401 midterm project", () => {
  let io, serverSocket, socketSays;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      socketSays = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        serverSocket = socket;
      });
      socketSays.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    socketSays.close();
  });

  test("should work", (done) => {
    socketSays.on("hello", (arg) => {
      expect(arg).toBe("world");
      done();
    });
    serverSocket.emit("hello", "world");
  });

  test("should work (with ack)", (done) => {
    serverSocket.on("hi", (cb) => {
      cb("hola");
    });
    socketSays.emit("hi", (arg) => {
      expect(arg).toBe("hola");
      done();
    });
  });

  test('Should emit START', (done) => {
    socketSays.on('PLAY_GAME', (arg) => {
      expect(arg).toBe('START');
      done();
    });
    serverSocket.emit('PLAY_GAME', 'START');
  });

  test('Should emit NEXT_SEQUENCE', (done) => {
    socketSays.on('CORRECT', (arg) => {
      expect(arg).toBe('NEXT_SEQUENCE');
      done();
    });
    serverSocket.emit('CORRECT', 'NEXT_SEQUENCE');
  });
});


// const { io } = require('socket.io-client');
// const socket = io('http://localhost:3002/socket-says');
// const 

// jest.mock('socket.io-client', () => {
//   return {
//       io: jest.fn(() => {
//           return {
//               on: jest.fn(),
//               emit: jest.fn(),
//           };
//       }),
//   };
// });

// const handleCLientJoin = require('../../src/server/handleClientJoin');

// describe('Tests for client joining the server', () => {
//   test.todo('Client joining the server, causes message to display on server screen', () => {
//     // client joining the server

//     // expect(console.log).toEqual(''); // causes message to display on server screen
//   });
// }); 