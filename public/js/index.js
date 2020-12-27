var socket = io.connect();

var current_room = "";

var my_username = "";

var players_list = [];

var administrator = false;

socket.on('room-id', function(room_id) {
    current_room = room_id;

    Hide("room-controls")

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
    Display("launch-game")

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
        Display("lobby")
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