const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

//list of all influence cards
let cards = [1,2,3,4]

//list of all objectives
let objectives = {

  //Area 1 objectives
  0: {name: "Agamator", value: 5, power: "Make a player discard a card", cost: 0},
  1: {name: "Kthera", value: 5, power: "Steal a card from someone else", cost: 0},
  2: {name: "Zobi", value: 5, power: "Make two players draw one card each", cost: 0},
  
  //Area 2 objectives
  3: {name: "Brokhor", value: 8, power:"Choose one of the two next priests", cost: 2},
  4: {name: "Amganon", value: 8, power:"Exchange this god against another on the table", cost: 1},
  5: {name: "Sitifor", value: 8, power:"Secretly, look at the religious alignement of somebody", cost: 2},
  
  //Area 3 objectives
  6: {name: "Bulbur", value: 10, power:"Kill a daemon", cost: 3},
  7: {name: "Stulo", value: 10, power:"Steal a daemon", cost: 3},
  8: {name: "Dipis", value: 10, power:"Choose the next two priests", cost: 4},
}

//list of connected users
let users = {};

//dictionary of current games
let games_list = [];

//list of energy choices for each room
let energy_choices = []

//list of votes for each room
let votes_room = []

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

      io.sockets.to(currentRoomId).emit('players-list', tmp_users)

      const new_game = new GameManagement(tmp_users,tmp_ids,currentRoomId)
      games_list.push(currentRoomId)
    })

    socket.on("energy", (choice) => {
        energy_choices.push(choice)
    })

    socket.on("vote", (vote) => {
      votes_room.push(vote)
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
        this.gods_dictionary = []
        this.votes_dictionary = []
        this.room = room
        this.energy_choice = []
        this.vote_choice = []
        this.roles_list = []
        this.cards_selected = []
        this.random_player1 = undefined
        this.random_player2 = undefined
        this.era = 1
        this.epoch = 0
        this.era1 = [0,1,2]
        this.era2 = [3,4,5]
        this.era3 = [6,7,8]
        this.current_god = undefined
        this.success = undefined
        //this.timer = setTimeout(this.stopNegotation.bind(this), 30000)
        this.giveRoles()
        this.distributeCards()

        this.handleEra()
     }

     giveRoles(){
      this.roles_list = [...this.game_users_list]
      shuffle(this.roles_list)
      io.sockets.to(this.room).emit('roles',this.roles_list)
     }

     distributeCards(){
       for(let i = 0; i < this.number_of_users; i++){
         var cards_hand = []
         for(let i = 0 ; i < 5 ; i++){
           var random = cards[Math.floor(Math.random() * cards.length)];
           cards_hand.push(random)
         }
         this.card_dictionary.push(cards_hand)
         this.gods_dictionary.push([])
         this.votes_dictionary.push(0)
       }
       this.updateCards()
       this.updateGods()
     }

     updateCards(){
      io.sockets.to(this.room).emit('cards',this.card_dictionary)
     }

     updateGods(){
      io.sockets.to(this.room).emit('gods-dict',this.gods_dictionary)
    }

      //between a lot of these steps, we apply an update of the cards distribution
        //this.randomDuo()
        //this.randomGod()
        //this.resolveEnergy()
        //this.vote()
        //this.resolvePowers()

     handleEra(){
        this.epoch++
        if(this.epoch == 4){
          this.era++
          this.epoch = 1
        }
        io.sockets.to(this.room).emit('current-area',this.era)
        this.randomDuo()
     }

     randomDuo(){
       this.random_player1 = Math.floor(Math.random() * this.game_users_list.length);
       this.random_player2 = this.random_player1
       while(this.random_player2 === this.random_player1){
        this.random_player2 = Math.floor(Math.random() * this.game_users_list.length);
       }
       io.sockets.to(this.room).emit('duo', {rnd1: this.random_player1,rnd2: this.random_player2})
       this.randomGod()
      }

      randomGod(){
          switch(this.era){
            case 1:
              var rnd_index = Math.floor(Math.random() * this.era1.length)
              this.current_god = this.era1[rnd_index];
              io.sockets.to(this.room).emit('god', this.current_god)
              this.era1.splice(rnd_index,1)
              break
            case 2:
              var rnd_index = Math.floor(Math.random() * this.era2.length)
              this.current_god = this.era2[rnd_index];
              io.sockets.to(this.room).emit('god', this.current_god)
              this.era2.splice(rnd_index,1)
              break
            case 3:
              var rnd_index = Math.floor(Math.random() * this.era3.length)
              this.current_god = this.era3[rnd_index];
              io.sockets.to(this.room).emit('god', this.current_god)
              this.era3.splice(rnd_index,1)
              break
          }
          this.resolveEnergy();
      }

    resolveEnergy(){
        for(let i = 0; i < energy_choices.length; i++){
          if(energy_choices[i].room == this.room){
              this.energy_choice.push(energy_choices[i])
              energy_choices.splice(i,1)
          }
        }
        if(this.energy_choice == undefined || this.energy_choice.length < 2){
          setTimeout(() => this.resolveEnergy(), 1000);
        }
        else{
          this.calculateEnergy();
        }
     }

    calculateEnergy(){
      //invert things if they didn't send in the correct order
      if(this.random_player1 > this.random_player2){
        var tmp = this.energy_choice[0]
        this.energy_choice[0] = this.energy_choice[1]
        this.energy_choice[1] = tmp
      }
      for (let i = 0; i < this.energy_choice[0].hand_choice.length ; i++){
        if(this.energy_choice[0].hand_choice[i] == 1){
           this.cards_selected.push(this.card_dictionary[this.random_player1][i])
           delete this.card_dictionary[this.random_player1][i]
        }
      }
      this.card_dictionary[this.random_player1] = this.card_dictionary[this.random_player1].filter(function (el) {
        return el != null;
      });
      for (let i = 0; i < this.energy_choice[1].hand_choice.length ; i++){
        if(this.energy_choice[1].hand_choice[i] == 1){
           this.cards_selected.push(this.card_dictionary[this.random_player2][i])
           delete this.card_dictionary[this.random_player2][i]
        }
      }
      this.card_dictionary[this.random_player2] = this.card_dictionary[this.random_player2].filter(function (el) {
        return el != null;
      });

       this.energy_choice = []

       this.updateCards();
       this.sendResult();
     }

     sendResult(){
       var result = 0
       for(let i = 0; i < this.cards_selected.length; i++){
          result += this.cards_selected[i]
       }
       if(result >= objectives[this.current_god].value){
          this.success = true
       }
       else{
          this.success = false
       }
       io.sockets.to(this.room).emit('result', {power: result,bool: this.success})
       this.cards_selected = []
       if(this.success === true){
         this.vote()
       }
       else{
         this.handleEra()
       }
      }

      vote(){
          io.sockets.to(this.room).emit('start-vote')
          this.resolveVote()
      }

      resolveVote(){
        for (let i = 0; i < votes_room.length; i++){
            if(votes_room[i].room == this.room){
              this.vote_choice.push(votes_room[i])
              votes_room.splice(i,1)
            }
        }
        if(this.vote_choice == undefined || this.vote_choice.length < this.number_of_users){
          setTimeout(() => this.resolveVote(), 1000)
        }
        else{
          this.calculateVote()
        }
      }

      calculateVote(){
          for (let i = 0; i < this.vote_choice.length; i++){
              this.votes_dictionary[this.game_users_list.indexOf(this.vote_choice[i].vote)]++ 
          }
          this.sendVoteResult()
          this.vote_choice = []
      }

      sendVoteResult(){
          var max = 0
          var index_max = 0
          var equality = false
          for (let i = 0; i < this.votes_dictionary.length; i++){
              if(this.votes_dictionary[i] > max){
                max = this.votes_dictionary[i]
                index_max = i
                equality = false
              }
              else if(this.votes_dictionary[i] == max){
                equality = true
              }
          }

          this.votes_dictionary = []
          for (let i = 0; i < this.game_users_list.length; i++){
              this.votes_dictionary.push(0)
          }

          if(equality == false){
            this.gods_dictionary[index_max].push(this.current_god)
          }
          this.updateGods()

          io.sockets.to(this.room).emit('vote-result', {max: max, index_max: index_max, equality: equality})

          this.Power0()
      }
      Power0(){

        this.Power1()
      }
      Power1(){

        this.Power2()
      }
      Power2(){

        this.Power3()
      }
      Power3(){

        this.Power4()
      }
      Power4(){

        this.Power5()
      }
      Power5(){

        this.Power6()
      }
      Power6(){

        this.Power7()
      }
      Power7(){

        this.Power8()
      }
      Power8(){

        this.handleEra()
      }
}