const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

//list of all influence cards
let cards = [1,3,4,6]

//colors : 0 = red and 1 = yellow

//list of all objectives
let objectives = {
  
  //Area 1 objectives
  0: {name: "Agamator", value: 15, power: "Make a player discard a card", cost: 0, color: 0}, //done
  1: {name: "Kthera", value: 20, power: "Steal a card from someone else", cost: 0, color: 1}, //done
  2: {name: "Zobi", value: 25, power: "Make a player draw 2 cards", cost: 0, color: 1}, //done
  
  //Area 2 objectives
  3: {name: "Brokhor", value: 15, power:"Change a deamon's family", cost: 2, color: 0}, //done
  4: {name: "Amganon", value: 20, power:"Exchange two hands", cost: 2, color: 1}, //done
  5: {name: "Dipis", value: 25, power:"Choose the next two priests", cost: 2, color: 0}, //done
  
  //Area 3 objectives
  6: {name: "Bulbur", value: 20, power:"Kill a daemon", cost: 3, color: 1}, //done
  7: {name: "Stulo", value: 15, power:"Steal a daemon", cost: 3, color: 1}, //done
  8: {name: "Sitifor", value: 25, power:"Secretly, look at the religious alignement of somebody", cost: 3, color: 0}, //done
}

var gods_names = []
for(let i = 0; i < 9; i++){
  gods_names.push(objectives[i].name)
}

//list of powers
let powers = []

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

    socket.on("power", (power) => {
      powers.push(power)
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
        this.colors = []
        this.room = room
        this.energy_choice = []
        this.vote_choice = []
        this.roles_list = []
        this.cards_selected = []
        this.gods_selected = []
        this.random_player1 = undefined
        this.random_player2 = undefined
        this.era = 1
        this.epoch = 0
        this.era1 = [0,1,2]
        this.era2 = [3,4,5]
        this.era3 = [6,7,8]
        this.current_god = undefined
        this.success = undefined
        this.power0 = undefined
        this.power1 = undefined
        this.power2 = undefined
        this.power3 = undefined
        this.power4 = undefined
        this.power5 = undefined
        this.power6 = undefined
        this.power7 = undefined
        this.power8 = undefined
        this.duo_selected = false
        this.duo1 = undefined
        this.duo2 = undefined

        //this.timer = setTimeout(this.stopNegotation.bind(this), 30000)
        this.setColors()
        this.giveRoles()
        this.distributeCards()

        this.handleEra()
     }

     setColors(){
      for(let i = 0; i < 9; i++){
        this.colors.push(objectives[i].color)
      }
      this.updateColors()
    }

    updateColors(){
      io.sockets.to(this.room).emit('colors', this.colors)
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
       if(this.duo_selected == false){
          this.random_player1 = Math.floor(Math.random() * this.game_users_list.length);
          this.random_player2 = this.random_player1
          while(this.random_player2 === this.random_player1){
            this.random_player2 = Math.floor(Math.random() * this.game_users_list.length);
          }
       }
       else{
         this.random_player1 = this.duo1
         this.random_player2 = this.duo2
       }
       this.duo_selected = false
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
      for (let i = 0; i < this.energy_choice[0].hand_choice.length ; i++){
        if(this.energy_choice[0].hand_choice[i] == 1){
           this.cards_selected.push(this.card_dictionary[this.energy_choice[0].player][i])
           delete this.card_dictionary[this.energy_choice[0].player][i]
        }
      }
      if(this.energy_choice[0].hand_choice.length != 0){
        this.card_dictionary[this.energy_choice[0].player] = this.card_dictionary[this.energy_choice[0].player].filter(function (el) {
          return el != null;
        });
      }
      for (let i = 0; i < this.energy_choice[1].hand_choice.length ; i++){
        if(this.energy_choice[1].hand_choice[i] == 1){
           this.cards_selected.push(this.card_dictionary[this.energy_choice[1].player][i])
           delete this.card_dictionary[this.energy_choice[1].player][i]
        }
      }
      if(this.energy_choice[1].hand_choice.length != 0){
        this.card_dictionary[this.energy_choice[1].player] = this.card_dictionary[this.energy_choice[1].player].filter(function (el) {
          return el != null;
        });
      }

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
         this.Power0()
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
            this.gods_selected.push(this.current_god)
          }
          this.updateGods()

          io.sockets.to(this.room).emit('vote-result', {max: max, index_max: index_max, equality: equality})

          this.Power0()
      }


      CostPay(nb,selection){
          for(let i = 0 ; i < selection.length ; i++){
            if(selection[i] == 1){
              delete this.card_dictionary[nb][i]
            }
          }
          this.card_dictionary[nb] = this.card_dictionary[nb].filter(function (el) {
            return el != null;
          });
          this.updateCards()
      }

      Power0(){
        if(this.gods_selected.includes(0)){
            for (let i = 0; i < this.gods_dictionary.length ; i++){
               if(this.gods_dictionary[i].includes(0)){
                io.sockets.to(this.room).emit('power0',i)
               }
            }
            this.resolvePower0()
        }
        else{
          this.Power1()
        }
      }

      resolvePower0(){
        for (let i = 0; i < powers.length; i++){
          if(powers[i].room == this.room && powers[i].grade == 0){
            this.power0 = powers[i].power
            powers.splice(i,1)
            this.applyPower0()
          }
          else{
            setTimeout(() => this.resolvePower0(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower0(), 1000)
        }
      }

      applyPower0(){
        if(this.card_dictionary[this.game_users_list.indexOf(this.power0)].length != 0){
          this.card_dictionary[this.game_users_list.indexOf(this.power0)].splice(Math.floor(Math.random() * this.card_dictionary[this.game_users_list.indexOf(this.power0)].length),1)
          this.updateCards()
          this.Power1()
        }
        else{
          this.Power1()
        }
      }

      Power1(){
        if(this.gods_selected.includes(1)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(1)){
              io.sockets.to(this.room).emit('power1',i)
            }
          }
          this.resolvePower1()
        }
        else{
          this.Power2()
        }
      }

      resolvePower1(){
          for(let i = 0; i < powers.length ; i++){
            if(powers[i].room == this.room && powers[i].grade == 1){
              this.power1 = powers[i].power
              powers.splice(i,1)
              this.applyPower1()
            }
            else{
              setTimeout(() => this.resolvePower1(), 1000)
            }
          }
          if(powers.length == 0){
            setTimeout(() => this.resolvePower1(), 1000)
          }
      }

      applyPower1(){
        if(this.card_dictionary[this.game_users_list.indexOf(this.power1)].length != 0){
          var rnd_card = Math.floor(Math.random() * this.card_dictionary[this.game_users_list.indexOf(this.power1)].length)
          var card_value = this.card_dictionary[this.game_users_list.indexOf(this.power1)][rnd_card]
          this.card_dictionary[this.game_users_list.indexOf(this.power1)].splice(rnd_card,1)
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(1)){
              var power_player = i
            }
          }
          this.card_dictionary[power_player].push(card_value)
          this.updateCards()
          this.Power2()
        }
        else{
          this.Power2()
        }
      }

      Power2(){
        if(this.gods_selected.includes(2)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(2)){
              io.sockets.to(this.room).emit('power2',i)
            }
          }
          this.resolvePower2()
        }
        else{
          this.Power3()
        }
      }

      resolvePower2(){
        for(let i = 0; i < powers.length ; i++){
          if(powers[i].room == this.room && powers[i].grade == 2){
            this.power2 = powers[i].power
            powers.splice(i,1)
            this.applyPower2()
          }
          else{
            setTimeout(() => this.resolvePower2(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower2(), 1000)
        }
      }

      applyPower2(){
        for(let i = 0 ; i < 2 ; i++){
          var random = cards[Math.floor(Math.random() * cards.length)];
          this.card_dictionary[this.game_users_list.indexOf(this.power2)].push(random)
        }
        this.updateCards()
        this.Power3()
      }

      Power3(){
        if(this.gods_selected.includes(3)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(3)){
              io.sockets.to(this.room).emit('power3',i)
            }
          }
          this.resolvePower3()
        }
        else{
          this.Power4()
        }
      }

      resolvePower3(){
        for(let i = 0; i < powers.length ; i++){
          if(powers[i].room == this.room && powers[i].grade == 3){
            this.power3 = powers[i]
            powers.splice(i,1)
            this.applyPower3()
          }
          else{
            setTimeout(() => this.resolvePower3(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower3(), 1000)
        }
      }

      applyPower3(){
        if(this.power3.power == "ignore"){
          this.Power4()
        }
        else{
          this.CostPay(this.power3.player,this.power3.cost_card)

          if(this.colors[gods_names.indexOf(this.power3.power)] == 1){
            this.colors[gods_names.indexOf(this.power3.power)] = 0
          }
          else{
            this.colors[gods_names.indexOf(this.power3.power)] = 1
          }

          this.updateColors()
          this.Power4()
        }
      }

      Power4(){
        if(this.gods_selected.includes(4)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(4)){
              io.sockets.to(this.room).emit('power4',i)
            }
          }
          this.resolvePower4()
        }
        else{
          this.Power5()
        }
      }

      resolvePower4(){
        for(let i = 0; i < powers.length ; i++){
          if(powers[i].room == this.room && powers[i].grade == 4){
            this.power4 = powers[i]
            powers.splice(i,1)
            this.applyPower4()
          }
          else{
            setTimeout(() => this.resolvePower4(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower4(), 1000)
        }
      }

      applyPower4(){
        if(this.power4.power1 == "ignore"){
          this.Power5()
        }
        else{
          this.CostPay(this.power4.player,this.power4.cost_card)

          var tmp = this.card_dictionary[this.game_users_list.indexOf(this.power4.power1)]
          this.card_dictionary[this.game_users_list.indexOf(this.power4.power1)] = this.card_dictionary[this.game_users_list.indexOf(this.power4.power2)]
          this.card_dictionary[this.game_users_list.indexOf(this.power4.power2)] = tmp
          this.updateCards()
          this.Power5()
        }
      }

      Power5(){
        if(this.gods_selected.includes(5)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(5)){
              io.sockets.to(this.room).emit('power5',i)
            }
          }
          this.resolvePower5()
        }
        else{
          this.Power6()
        }
      }

      resolvePower5(){
        for(let i = 0; i < powers.length ; i++){
          if(powers[i].room == this.room && powers[i].grade == 5){
            this.power5 = powers[i]
            powers.splice(i,1)
            this.applyPower5()
          }
          else{
            setTimeout(() => this.resolvePower5(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower5(), 1000)
        }
      }

      applyPower5(){
        if(this.power5.power1 == "ignore"){
          this.Power6()
        }
        else{
          this.CostPay(this.power5.player,this.power5.cost_card)

          this.duo_selected = true

          this.duo1 = this.game_users_list.indexOf(this.power5.power1)
          this.duo2 = this.game_users_list.indexOf(this.power5.power2)

          this.Power6()
        }
      }

      Power6(){        
        if(this.gods_selected.includes(6)){
        for(let i = 0; i < this.gods_dictionary.length ; i++){
          if(this.gods_dictionary[i].includes(6)){
            io.sockets.to(this.room).emit('power6',i)
          }
        }
        this.resolvePower6()
      }
      else{
        this.Power7()
      }
      }

      resolvePower6(){
        for(let i = 0; i < powers.length ; i++){
          if(powers[i].room == this.room && powers[i].grade == 6){
            this.power6 = powers[i]
            powers.splice(i,1)
            this.applyPower6()
          }
          else{
            setTimeout(() => this.resolvePower6(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower6(), 1000)
        }
      }

      applyPower6(){
        if(this.power6.power == "ignore"){
          this.Power7()
        }
        else{
          this.CostPay(this.power6.player,this.power6.cost_card)

          for (let i = 0; i < this.gods_dictionary.length ; i++){
              if(this.gods_dictionary[i].includes(gods_names.indexOf(this.power6.power))){
                this.gods_dictionary[i].splice(this.gods_dictionary[i].indexOf(gods_names.indexOf(this.power6.power)),1)
              }
          }
          this.updateGods()
          this.Power7()
        }
      }

      Power7(){
        if(this.gods_selected.includes(7)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(7)){
              io.sockets.to(this.room).emit('power7',i)
            }
          }
          this.resolvePower7()
        }
        else{
          this.Power8()
        }
      }

        resolvePower7(){
          for(let i = 0; i < powers.length ; i++){
            if(powers[i].room == this.room && powers[i].grade == 7){
              this.power7 = powers[i]
              powers.splice(i,1)
              this.applyPower7()
            }
            else{
              setTimeout(() => this.resolvePower7(), 1000)
            }
          }
          if(powers.length == 0){
            setTimeout(() => this.resolvePower7(), 1000)
          }
        }

        applyPower7(){
          if(this.power7.power == "ignore"){
            this.Power8()
          }
          else{
            this.CostPay(this.power7.player,this.power7.cost_card)

            this.gods_dictionary[this.power7.my_nb].push(gods_names.indexOf(this.power7.power))
            for (let i = 0; i < this.gods_dictionary.length ; i++){
                if(this.gods_dictionary[i].includes(gods_names.indexOf(this.power7.power)) && i != this.power7.my_nb){
                  this.gods_dictionary[i].splice(this.gods_dictionary[i].indexOf(gods_names.indexOf(this.power7.power)),1)
                }
            }
            this.updateGods()
            this.Power8()
          }
        }

      Power8(){
        if(this.gods_selected.includes(8)){
          for(let i = 0; i < this.gods_dictionary.length ; i++){
            if(this.gods_dictionary[i].includes(8)){
              io.sockets.to(this.room).emit('power8',i)
            }
          }
          this.resolvePower8()
        }
        else{
          this.DrawCards()
        }

      }

      resolvePower8(){
        for(let i = 0; i < powers.length ; i++){
          if(powers[i].room == this.room && powers[i].grade == 8){
            this.power8 = powers[i]
            powers.splice(i,1)
            this.applyPower8()
          }
          else{
            setTimeout(() => this.resolvePower8(), 1000)
          }
        }
        if(powers.length == 0){
          setTimeout(() => this.resolvePower8(), 1000)
        }
      }

      applyPower8(){
        if(this.power8.power == "ignore"){
          this.DrawCards()
        }
        else{
            this.CostPay(this.power5.player,this.power5.cost_card)
            this.DrawCards()
          }
      }

      DrawCards(){
        if(this.epoch == 3){
          for(let i = 0; i < this.number_of_users; i++){
            var random = cards[Math.floor(Math.random() * cards.length)];
            this.card_dictionary[i].push(random)
          }
          this.updateCards()
        }
        this.handleEra()
      }
}