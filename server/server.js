const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

//list of connected user
let users = {};

//list of active rooms
let rooms = {}

//call our express function
let app = express();

//specify the http method to let the http connection in
let server = http.createServer(app);

//set up our socketIO connection
let io = socketIO(server);

//set our express server
app.use(express.static(publicPath));

//connection to the port
server.listen(port, ()=> {
    console.log(`Server is up on port ${port}.`)
});

io.sockets.on('connection', function(socket) {

    console.log("A user just connected.")
    socket.on('send-username', function(username) {
      console.log("pseudonym changed")
      users[socket.id] = username;
    });

    socket.on('create', function(room) {
      socket.join(room);
      console.log("Room created with ID : ", room, " by user : ", users[socket.id])
      console.log(socket.rooms);
    });

    socket.on('join', function(room){

      //check if this room exists
      if(io.sockets.adapter.rooms.has(room)){
        socket.join(room);
        console.log("Room : ", room, " joined by user : ", users[socket.id])
        console.log(socket.rooms);
      }
      else{
        console.log("Sorry, but this room does not exist.")
      }
    })

    socket.on('ping', () => {
        console.log(io.sockets.adapter.rooms);
    });

    socket.on('disconnecting', () => {
        //Do something here
    });

    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
        delete users[socket.id];
    })
});