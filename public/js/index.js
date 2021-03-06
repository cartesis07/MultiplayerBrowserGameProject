var socket = io.connect();
var current_room = "";
var my_username = "";
var players_list = [];
var number_in_list = undefined;
var roles_list = [];
var administrator = false;
var my_role = undefined;
var cards_dictionary = undefined;
var gods_dictionary = undefined;
var my_hand = undefined;
var hand_select = undefined;
var duo1 = undefined
var duo2 = undefined
var current_god = undefined
var current_area = 0

//list of all objectives
let objectives = {

    //Area 1 objectives
    0: {name: "Agamator", value: 6, power: "Make a player discard a card", cost: 0},
    1: {name: "Kthera", value: 6, power: "Steal a card from someone else", cost: 0},
    2: {name: "Zobi", value: 6, power: "Make two players draw one card each", cost: 0},
    
    //Area 2 objectives
    3: {name: "1", value: 10, power:"Choose one of the two next priests", cost: 2},
    4: {name: "1", value: 10, power:"Exchange this god against another on the table", cost: 1},
    5: {name: "1", value: 10, power:"Secretly, look at the religious alignement of somebody", cost: 2},
    
    //Area 3 objectives
    6: {name: "1", value: 16, power:"Kill a daemon", cost: 3},
    7: {name: "1", value: 16, power:"Steal a daemon", cost: 3},
    8: {name: "1", value: 16, power:"Choose the next two priests", cost: 4},
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

    var parent = document.getElementById("all-gods")
    parent.innerHTML = ""
    var list = gods_dictionary[player_number]
    for(let i = 0 ; i < list.length ; i++){
        var card = document.createElement("div")
        card.setAttribute("class","card")
    
        var image = document.createElement("img")
        image.src="./ressources/" + list[i] + ".jpeg"
        image.style = "width:100%"
        card.appendChild(image)
    
        var div_container = document.createElement("div")
        div_container.setAttribute("class","container")
        div_container.innerHTML = "<h5><b>"+ objectives[list[i]].name + "</br>" + "Power " + objectives[list[i]].value +"<b/><h5/><p> " + objectives[list[i]].power + " </p>"
        card.appendChild(div_container)
    
        parent.appendChild(card)
    }
}

function SendEnergy(){
    socket.emit('energy',{room: current_room, player: number_in_list, hand_choice: hand_select})
    Hide("send-energy")
    // Swal.fire({
    //     icon: 'success',
    //     title: 'Energy sent',
    // })
}

function Vote(){
    socket.emit('vote',{room: current_room, vote: document.getElementById("exampleFormControlSelect1").value})
    Hide("send-energy")
    //Swal.fire({
    //     icon: 'success',
    //     title: 'Vote sent',
    //})
    Hide("vote")
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
    number_in_list = NumberInList()
    my_hand = cards_dict[number_in_list]
    UpdateMyCards(cards_dict[number_in_list])
})

socket.on('gods-dict', (gods_dict) => {
    gods_dictionary = gods_dict
})

socket.on('duo',(random_players) => {
    duo1 = players_list[random_players.rnd1]
    duo2 = players_list[random_players.rnd2]
    var duo = document.getElementById("duo").innerHTML = "<h5>The selected duo is " + players_list[random_players.rnd1] + " and " + players_list[random_players.rnd2] + "</h5>"
    if(players_list[random_players.rnd1] === my_username || players_list[random_players.rnd2] === my_username){
        Display("send-energy")
    }
})

socket.on('god', (god) => {
    current_god = god
    var index = current_god + current_area*3
    var objective = document.getElementById("objective-to-do")
    objective.innerHTML = ""

    var card = document.createElement("div")
    card.setAttribute("class","card")

    var image = document.createElement("img")
    image.src="./ressources/" + index + ".jpeg"
    image.style = "width:100%"
    card.appendChild(image)

    var div_container = document.createElement("div")
    div_container.setAttribute("class","container")
    div_container.innerHTML = "<h5><b>"+ objectives[index].name + "</br>" + "Power " + objectives[index].value +"<b/><h5/><p> " + objectives[index].power + " </p>"
    card.appendChild(div_container)

    objective.appendChild(card)
    Display("objective-to-do")
})

socket.on('result', (results) => {
    if(results.bool === true){
        Swal.fire({
            icon: 'info',
            title: 'This deamon has been beaten',
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
    var input = document.getElementById("exampleFormControlSelect1")
    input.innerHTML = ""
    for (let i = 0 ; i < players_list.length ; i++){
        if(players_list[i] != duo1 && players_list[i] != duo2){
            var option = document.createElement("option")
            option.innerText = players_list[i]
            input.appendChild(option)
        }
    }
    Display("vote")
})

socket.on('vote-result', (vote_results) => {
    Hide("objective-to-do")
    if(vote_results.equality === true){
        Swal.fire({
            icon: 'info',
            title: 'Equality',
            text: 'This deamon has been destroyed'
          })
    }
    else{
        Swal.fire({
            icon: 'info',
            title: 'Vote results',
            text: players_list[vote_results.index_max] + ' obtained ' + vote_results.max + ' votes and acquires ' + objectives[current_god].name
          })
    }
})