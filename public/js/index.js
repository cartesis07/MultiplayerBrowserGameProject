var socket = io.connect();
var current_room = "";
var my_username = "";
var players_list = [];
var roles_list = [];
var administrator = false;
var my_role = undefined;
var cards_dictionary = undefined;
var my_hand = undefined;
var hand_select = undefined;

//list of all objectives
let objectives = {

    //Area 1 objectives
    1: {name: "Agamator", value: 6, power: "Make a player discard a card", cost: 0},
    2: {name: "Kthera", value: 6, power: "Steal a card from someone else", cost: 0},
    3: {name: "Zobi", value: 6, power: "Make two players draw one card each", cost: 0},
    
    //Area 2 objectives
    4: {name: "1", value: 10, power:"Choose one of the two next priests", cost: 2},
    5: {name: "1", value: 10, power:"Exchange this god against another on the table", cost: 1},
    6: {name: "1", value: 10, power:"Secretly, look at the religious alignement of somebody", cost: 2},
    
    //Area 3 objectives
    7: {name: "1", value: 16, power:"Kill a daemon", cost: 3},
    8: {name: "1", value: 16, power:"Steal a daemon", cost: 3},
    9: {name: "1", value: 16, power:"Choose the next two priests", cost: 4},
}

role_hidden = false;

socket.on('room-id', function(room_id) {
    current_room = room_id;

    Hide("room-controls")
    Display("leave-section")
    Display("lobby")

    UpdateRoomIDDisplay();
});

socket.on('players-list', function(users_list){
    players_list = users_list
    UpdateRoomListDisplay();
});

socket.on('alert-room', () => {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Sorry, this room does not exist !',
      })
})

function CreateRoom() {
    socket.emit('leave', current_room)
    socket.emit('create', document.getElementById("input-room").value);
    players_list = [my_username]

    administrator = true;

    Hide("room-controls")
    Display("lobby")
    Display("launch-game")
    Display("leave-section")

    UpdateRoomIDDisplay();
    UpdateRoomListDisplay();
}

function JoinRoom() {
    socket.emit('leave', current_room)
    socket.emit('join', document.getElementById("input-room").value);
}

function ShowRooms(){
    socket.emit('ping');
}

function SendUsername(){
    my_username = document.getElementById("input-username").value

    if (my_username !== "" && my_username.length < 12){
        socket.emit('send-username', my_username)
    
        Hide("first-action")
        Display("room-controls")
    }
    else{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please, enter a valid username !',
          })
    }
}

function LeaveRoom() {
    socket.emit('leave', current_room)
    current_room = ""
    players_list = []

    administrator = false;
    Hide("launch-game");
    Hide("leave-section")
    Hide("lobby")

    Display("room-controls");

    UpdateRoomIDDisplay();
    UpdateRoomListDisplay();
}

function UpdateRoomIDDisplay(){
    document.getElementById("room-id").innerHTML = current_room;
}

function UpdateRoomListDisplay(){
    document.getElementById("players-list").innerHTML = players_list.toString()
}

function Display(block){
    document.getElementById(block).style.display = "block"
}

function Hide(block){
    document.getElementById(block).style.display = "none"
}

//administrator launch the game
function LaunchGame(){
    if(players_list.length < 2){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You have to be at least 2 players in the room to launch this game !',
          })
    }
    else{
        socket.emit('launch-game');
    }
}

function HideAndShowRole(){
    if(role_hidden === false){
        Hide("my-role")
        document.getElementById("role-button").innerHTML = "Show Role"
    }
    else{
        Display("my-role")
        document.getElementById("role-button").innerHTML = "Hide Role"
    }
    role_hidden = !role_hidden
}

function NumberInList(){
    for (let i = 0 ; i < players_list.length ; i++){
        if (players_list[i] === my_username){
            return i;
        }
    }
}

function SelectCard(nb){
    if(hand_select[nb] == 1){
        hand_select[nb] = 0
        document.getElementById("influence-card-" + nb).style.outline= ""
    }
    else{
        hand_select[nb] = 1
        document.getElementById("influence-card-" + nb).style.outline= "1px solid rgb(0, 0, 143)"
    }
}

function UpdateMyCards(list){
    var influence = document.getElementById("my-influence")
    //Clearing all cards and hand selection
    influence.innerHTML = ""
    hand_select = []

    for (let i = 0 ; i < list.length ; i++){

        hand_select.push(0)

        var card = document.createElement("div")
        card.className = "card"
        card.setAttribute("onClick","SelectCard(" + i + ")")
        card.id = "influence-card-" + i
        var logo = document.createElement("i")
        logo.className="fas fa-burn fa-4x"
        card.appendChild(logo)
        var div_container = document.createElement("div")
        div_container.className="container"
        div_container.innerHTML = "<h4><b>"+ list[i] +"<b/><h4/>"
        card.appendChild(div_container)
        influence.appendChild(card)
    }
} 

function updateModal(player_number){
    document.getElementById("exampleModalLabel").innerText = players_list[player_number] + " has " + cards_dictionary[player_number].length + " energy cards"
}

function SendEnergy(){
    socket.emit('energy',{room: current_room, player: NumberInList(), hand_choice: hand_select})
    Hide("send-energy")
    // Swal.fire({
    //     icon: 'success',
    //     title: 'Energy sent',
    // })
}

//game launched by the administrator
socket.on('game-launched', () => {
    Hide("lobby")
    Hide("launch-game")
    Hide("leave-section")
    Display("the-game")

    for(let i = 0; i < players_list.length; i++){
        var button = document.createElement("button");
        button.type = "button"
        button.className="btn btn-dark"
        button.innerHTML=players_list[i]
        button.setAttribute("data-toggle","modal")
        button.setAttribute("data-target","#exampleModal")
        button.setAttribute("onClick","updateModal(" + i + ")")

        var element = document.getElementById("players-interactions");
        element.appendChild(button);  
    }
})

socket.on('roles', (roles) => {
    roles_list = roles
    const usernameCompare = (element) => element == my_username;
    var index = roles_list.findIndex(usernameCompare)
    if (index == 0){
        my_role = "Traitor"
        // Swal.fire({
        //     icon: 'info',
        //     title: 'You are a traitor !',
        // })
    }
    else {
        my_role = "Crewmate"
        // Swal.fire({
        //     icon: 'info',
        //     title: 'You are a crewmate !',
        // })
    }
    document.getElementById("my-role").innerHTML = my_role;
    Display("my-role")
})

socket.on('cards', (cards_dict) => {
    cards_dictionary = cards_dict
    my_hand = cards_dict[NumberInList()]
    UpdateMyCards(cards_dict[NumberInList()])
})

socket.on('duo',(random_players) => {
    var duo = document.getElementById("duo").innerHTML = "<h5>The selected duo is " + players_list[random_players.rnd1] + " and " + players_list[random_players.rnd2] + "</h5>"
    if(players_list[random_players.rnd1] === my_username || players_list[random_players.rnd2] === my_username){
        Display("send-energy")
    }
})

socket.on('god', (god) => {
    var objective = document.getElementById("objective-to-do")
    objective.innerHTML = ""

    var card = document.createElement("div")
    card.setAttribute("class","card")

    var image = document.createElement("img")
    image.src="./ressources/" + god + ".jpeg"
    image.style = "width:100%"
    card.appendChild(image)

    var div_container = document.createElement("div")
    div_container.setAttribute("class","container")
    div_container.innerHTML = "<h5><b>"+ objectives[god].name + "</br>" + "Power " + objectives[god].value +"<b/><h5/><p> " + objectives[god].power + " </p>"
    card.appendChild(div_container)

    objective.appendChild(card)
})

socket.on('result', (results) => {
    console.log(results)
    if(results.bool === true){
        Swal.fire({
            icon: 'info',
            title: 'This deamon has been beaten !',
            text: 'The duo sent ' + results.power + ' energy'
          })
    }
    else{
        Swal.fire({
            icon: 'info',
            title: 'This deamon has not been beaten !',
            text: 'The duo sent ' + results.power + ' energy'
        })
        document.getElementById("objective-to-do").innerHTML = ""
    }
    var new_line = document.createElement("div")
    new_line.innerHTML = "<h5>The duo sent " + results.power + " energy </h4>"

    document.getElementById("duo").appendChild(new_line)
})

socket.on('start-vote', () => {
    Display("vote")
})