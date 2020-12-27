const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

//list of connected user
let users = {};

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

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

io.sockets.on('connection', function(socket) {

  var currentRoomId;

    console.log("A user just connected.")
    socket.on('send-username', function(username) {
      users[socket.id] = username;
      console.log("Pseudonym changed to : ",username)
    });

    socket.on('create', function() {

      var room_name = makeid(6);

      socket.join(room_name);
      console.log("Room created with ID : ", room_name, " by user : ", users[socket.id])
      console.log(socket.rooms);

      currentRoomId = room_name;

      io.sockets.to(room_name).emit('room-id', room_name);

    });

    socket.on('join', function(room){

      //check if this room exists
      if(io.sockets.adapter.rooms.has(room)){
        socket.join(room);
        console.log("Room : ", room, " joined by user : ", users[socket.id])
        console.log(socket.rooms);

        io.sockets.to(room).emit('room-id', room);

        currentRoomId = room;

        //broadcast players list into room
        players_set = io.sockets.adapter.rooms.get(room)
        tmp_users = []
        players_set.forEach(element => {
          tmp_users.push(users[element])
        });
        
        io.sockets.to(room).emit('players-list', tmp_users)
      }
      else{
        io.sockets.to(socket.id).emit('alert-room');
      }
    })

    socket.on('ping', () => {
        console.log(io.sockets.adapter.rooms);
    });

    socket.on('leave', function(room_name) {
      socket.leave(room_name);

      if(currentRoomId !== undefined){
        //broadcast players list into room
        players_set = io.sockets.adapter.rooms.get(room_name)
        tmp_users = []
        if (players_set !== undefined){
          players_set.forEach(element => {
          tmp_users.push(users[element])
          });
        io.sockets.to(room_name).emit('players-list', tmp_users)
        }
      }

      currentRoomId = undefined;

    })

    socket.on('disconnecting', () => {
        //Do something here
    });

    socket.on('disconnect', () => {
        console.log('A user has disconnected.');

        if(currentRoomId !== undefined){
          //broadcast players list into room
          players_set = io.sockets.adapter.rooms.get(currentRoomId)
          tmp_users = []
          if (players_set !== undefined){
            players_set.forEach(element => {
            tmp_users.push(users[element])
            });
          io.sockets.to(currentRoomId).emit('players-list', tmp_users)
          }
        }

        delete users[socket.id];
    })
});