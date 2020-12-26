var socket = io.connect();

function CreateRoom(){
    socket.emit('create', 'test');
}

function JoinRoom(){
    socket.emit('join', 'test');
}

function LeaveRoom(){
    socket.emit('leave', 'test');
}

function ShowRooms(){
    socket.emit('ping');
}