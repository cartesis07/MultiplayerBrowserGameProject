var socket = io.connect();

var current_room = "";

var my_username = "";

var players_list = [];

var administrator = false;

var role = "";

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

    if (my_username !== ""){
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
    Hide("lobby")
    Hide("launch-game")
    Hide("leave-section")
}

//game launched by the administrator
socket.on('game-launched', () => {
    if (administrator === false){
        Hide("lobby")
        Hide("launch-game")
        Hide("leave-section")
    }
})

//get roles for the game
socket.on('roles', function(traitor){
    if(traitor === my_username){
        document.getElementById("role-information").innerHTML = "You are the impostor"
        Display("role-information")
    }
    else{
        document.getElementById("role-information").innerHTML = "You are a crewmate"
        Display("role-information")
    }
})