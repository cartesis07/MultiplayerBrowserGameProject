var socket = io.connect();

var current_room = "";

socket.on('room-id', function(room_id) {
    current_room = room_id;
    UpdateRoomIDDisplay();
});


function CreateRoom() {
    socket.emit('leave', current_room)
    socket.emit('create', document.getElementById("input-room").value);
    UpdateRoomIDDisplay();
}

function JoinRoom() {
    socket.emit('leave', current_room)
    socket.emit('join', document.getElementById("input-room").value);
    UpdateRoomIDDisplay();
}

function ShowRooms(){
    socket.emit('ping');
}

function SendUsername(){
    socket.emit('send-username', document.getElementById("input-username").value)
}

function LeaveRoom() {
    socket.emit('leave', current_room)
    current_room = ""
    UpdateRoomIDDisplay();
}

function UpdateRoomIDDisplay(){
    document.getElementById("room-id").innerHTML = current_room;
}