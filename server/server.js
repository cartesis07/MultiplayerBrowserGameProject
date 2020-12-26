const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

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
    socket.on('create', function(room) {
      console.log("Room created")
      socket.join(room);
      console.log(socket.rooms);
    });
    socket.on('join', function(room){
      socket.join(room);
      console.log("Room joined")
      console.log(socket.rooms);
    })
    socket.on('ping', () => {
        console.log(io.sockets.adapter.rooms);
      });
    socket.on('disconnecting', () => {
        //Do something here
      });
    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    })
});