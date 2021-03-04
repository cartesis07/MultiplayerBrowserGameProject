const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

//list of all influence cards
let cards = [1,2,4,8]

//list of all objective
let objectives = {

//Area 1 objectives
1: {value: 0, positive: "", negative: ""},
2: {value: 0, positive: "", negative: ""},
3: {value: 0, positive: "", negative: ""},
4: {value: 0, positive: "", negative: ""},
5: {value: 0, positive: "", negative: ""},
6: {value: 0, positive: "", negative: ""},

//Area 2 objectives
7: {value: 0, positive: "", negative: ""},
8: {value: 0, positive: "", negative: ""},
9: {value: 0, positive: "", negative: ""},
10: {value: 0, positive: "", negative: ""},
11: {value: 0, positive: "", negative: ""},
12: {value: 0, positive: "", negative: ""},

//Area 3 objectives
13: {value: 0, positive: "", negative: ""},
14: {value: 0, positive: "", negative: ""},
15: {value: 0, positive: "", negative: ""},
16: {value: 0, positive: "", negative: ""},
17: {value: 0, positive: "", negative: ""},
18: {value: 0, positive: "", negative: ""}
}

//list of connected users
let users = {};

//dictionary of current games
let games_list = [];

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

    socket.on('launch-game', () => {
      io.sockets.to(currentRoomId).emit('game-launched')

      players_set = io.sockets.adapter.rooms.get(currentRoomId)
      tmp_users = []
      tmp_ids = []
      if (players_set !== undefined){
        players_set.forEach(element => {
        tmp_users.push(users[element])
        tmp_ids.push(element)
        });
      }

      const new_game = new GameManagement(tmp_users,tmp_ids,currentRoomId)
      games_list.push({
        key: currentRoomId,
        value: new_game
      })

    })
});

function shuffle(array) {
  var tmp, current, top = array.length;
  if(top) while(--top) {
    current = Math.floor(Math.random() * (top + 1));
    tmp = array[current];
    array[current] = array[top];
    array[top] = tmp;
  }
  return array;
}

class GameManagement {
     constructor(game_users_list,game_users_ids,room){
        this.game_users_list = game_users_list
        this.number_of_users = game_users_list.length
        this.game_users_ids = game_users_ids
        this.card_dictionary = []
        this.room = room
        //this.timer = setTimeout(this.stopNegotation.bind(this), 30000)
        this.giveRoles()
        this.distributeCards()
        this.randomDuo()
     }

     giveRoles(){
      var roles = shuffle(this.game_users_list)
      io.sockets.to(this.room).emit('roles',roles)
     }

     distributeCards(){
       for(let i = 0; i < this.number_of_users; i++){
         var cards_hand = []
         for(let i = 0 ; i < 5 ; i++){
           var random = cards[Math.floor(Math.random() * cards.length)];
           cards_hand.push(random)
         }
         this.card_dictionary.push(cards_hand)
       }
       io.sockets.to(this.room).emit('cards',this.card_dictionary)
     }

     randomDuo(){
       var random_player1 = Math.floor(Math.random() * this.game_users_list.length);
       var random_player2 = random_player1
       while(random_player2 === random_player1){
        random_player2 = Math.floor(Math.random() * this.game_users_list.length);
       }
       io.sockets.to(this.room).emit('duo', {rnd1: random_player1,rnd2: random_player2})
     }
}