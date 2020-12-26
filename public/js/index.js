var socket = io.connect();

function CreateRoom(){
    socket.emit('create', document.getElementById("input-room").value);
}

function JoinRoom(){
    socket.emit('join', document.getElementById("input-room").value);
}

function ShowRooms(){
    socket.emit('ping');
}

function SendUsername(){
    socket.emit('send-username', document.getElementById("input-username").value)
}