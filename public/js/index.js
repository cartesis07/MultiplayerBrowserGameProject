var socket = io.connect();
var current_room = "";
var my_username = "";
var players_list = [];
var administrator = false;
var my_role = undefined;
var my_influence = 0;

var ressources = ["Wood",]

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

        var element = document.getElementById("players-interactions");
        element.appendChild(button);  
    }
})

socket.on('roles', function(roles) {
    if (my_username === roles[0]){
        my_role = "Boss"
    }
    if (my_username === roles[1]){
        my_role = "Assassin"
    }
    if (players_list.length % 2 === 0){
        var lambda = Math.floor((players_list.length - 2) / 2)
    }
    else{
        var lambda = Math.floor((players_list.length - 2) / 2) + 1
    }
    for (let i = 0; i < lambda ; i++){
        if(my_username === roles[i + 2]){
            my_role = "Secret Agent"
        }
    }
    for (let i = lambda; i < players_list.length; i++){
        if(my_username === roles[i + 2]){
            my_role = "Counter Agent"
        }
    }
    document.getElementById('players-roles').innerHTML = my_role

    DisplayControls()
})

function ShowMyRole(){
    var x = document.getElementById("players-roles");
    var y = document.getElementById("role-button");
    if (x.style.display === "none") {
        x.style.display = "block";
        y.innerHTML = "Hide my role"
    } else {
        x.style.display = "none";
        y.innerHTML = "Show my role"
    }
}

function DisplayControls(){
    if(my_role === "Assassin"){
        var select = document.getElementById("assassin-select")
        for(let i = 0 ; i < players_list.length ;  i++){
            var option = document.createElement("option");
            option.text = players_list[i];
            select.appendChild(option);
        }
        Display("assassin-controls")
    }
    if(my_role === "Boss"){
        var select = document.getElementById("boss-select")
        for(let i = 0 ; i < players_list.length ;  i++){
            var option = document.createElement("option");
            option.text = players_list[i];
            select.appendChild(option);
        }
        Display("boss-controls")
        BossRevenue()

    }
}

function BossRevenue(){
    setInterval(() => {
        my_influence = my_influence + 1;
        document.getElementById("influence-amount").innerHTML = my_influence.toString();
    }, 8000);
}