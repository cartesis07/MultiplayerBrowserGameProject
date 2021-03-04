var socket = io.connect();
var current_room = "";
var my_username = "";
var players_list = [];
var roles_list = [];
var administrator = false;
var my_role = undefined;
var cards_dictionary = undefined;

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
    alert("Sorry, this room does not exist")
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
        alert("Please, enter a valid username.")
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
    socket.emit('launch-game');
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

function UpdateMyCards(list){
    var influence = document.getElementById("my-influence")
    //Clearing all cards
    influence.innerHTML = ""
    for (let i = 0 ; i < list.length ; i++){
        var card = document.createElement("div")
        card.className="card"
        var logo = document.createElement("i")
        logo.className="fas fa-burn fa-4x"
        card.appendChild(logo)
        var div_container = document.createElement("container")
        div_container.innerHTML = "<h4><b>"+ list[i] +"<b/><h4/>"
        card.appendChild(div_container)
        influence.appendChild(card)
    }
} 

function updateModal(player_number){
    document.getElementById("exampleModalLabel").innerText = "This player has " + cards_dictionary[player_number].length + " cards"
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
    }
    else {
        my_role = "Crewmate"
    }
    document.getElementById("my-role").innerHTML = my_role;
    Display("my-role")
})

socket.on('cards', (cards_dict) => {
    cards_dictionary = cards_dict
    UpdateMyCards(cards_dict[NumberInList()])
})

socket.on('duo',(random_players) => {
    var duo = document.getElementById("duo").innerHTML = "<h4>The selected duo is " + players_list[random_players.rnd1] + " and " + players_list[random_players.rnd2] + "</h4>"
})