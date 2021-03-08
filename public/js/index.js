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
var cards = [1,2,3,4]
var progress = 0
var regress = 0

//list of all objectives
let objectives = {
  
    //Area 1 objectives
    0: {name: "Agamator", value: 5, power: "Make a player discard a card", cost: 0, color: 0}, //done
    1: {name: "Kthera", value: 5, power: "Steal a card from someone else", cost: 0, color: 1}, //done
    2: {name: "Zobi", value: 5, power: "Make a player draw 2 cards", cost: 0, color: 1}, //done
    
    //Area 2 objectives
    3: {name: "Brokhor", value: 5, power:"Change a deamon's family", cost: 2, color: 0},
    4: {name: "Amganon", value: 5, power:"Exchange two hands", cost: 2, color: 1}, //done
    5: {name: "Dipis", value: 5, power:"Choose the next two priests", cost: 3, color: 0},
    
    //Area 3 objectives
    6: {name: "Bulbur", value: 5, power:"Kill a daemon", cost: 3, color: 0}, //done
    7: {name: "Stulo", value: 5, power:"Steal a daemon", cost: 3, color: 1}, //done
    8: {name: "Sitifor", value: 5, power:"Secretly, look at the religious alignement of somebody", cost: 2, color: 1}, //done
  }

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

function CopyID() {
    var tempInput = document.createElement("input");
    tempInput.value = document.getElementById("room-id").innerText;
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, 99999) /* For mobile devices */
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    var popoverEl = $("#my-popover");
    popoverEl.attr("data-content", "Copied !");
    popoverEl.popover("show");
}

function RefreshPopover(){
    var popoverEl = $("#my-popover");
    popoverEl.attr("data-content", "Copy Room ID");
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
    if(players_list.length < 3){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You have to be at least 3 players in the room to launch this game !',
          })
    }
    else{
        socket.emit('launch-game');
    }
}

function ShowRole(){
    if (my_role == "Traitor"){
        Swal.fire({
            icon: 'info',
            title: 'You are a traitor !',
        })
    }
    else {
        Swal.fire({
            icon: 'info',
            title: 'You are a crewmate !',
        })
    }
}

function NumberInList(){
    for (let i = 0 ; i < players_list.length ; i++){
        if (players_list[i] == my_username){
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
        logo.className="fas fa-burn fa-2x"
        card.appendChild(logo)
        var div_container = document.createElement("div")
        div_container.className="container"
        div_container.innerHTML = "<h4><b>"+ list[i] +"<b/><h4/>"
        card.appendChild(div_container)
        influence.appendChild(card)
    }
} 

function updateModal(player_number){
    document.getElementById("exampleModalLabel").innerText = players_list[player_number] + " has " + cards_dictionary[player_number].length + " energy cards and " + gods_dictionary[player_number].length + " daemons"

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
        div_container.innerHTML = "<h5><b>"+ objectives[list[i]].name + "</br>" + "Power : " + objectives[list[i]].value +"</br>Cost : " + objectives[list[i]].cost + "<b/><h5/><p> " + objectives[list[i]].power + " </p>"
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

function CardCount(){
    var card_count = 0
    for (let i = 0; i < hand_select.length; i++){
        if(hand_select[i] == 1){
            card_count++
        }
    }
    return card_count
}

function Power0(){
    socket.emit('power', {room: current_room, grade: 0, power: document.getElementById("form-power0").value})
    document.getElementById("form-power0").innerHTML = ""
    Hide('power0')
}

function Power1(){
    socket.emit('power', {room: current_room, grade: 1, power: document.getElementById("form-power1").value})
    document.getElementById("form-power1").innerHTML = ""
    Hide('power1')
}

function Power2(){
    socket.emit('power', {room: current_room, grade: 2, power: document.getElementById("form-power2").value})
    document.getElementById("form-power2").innerHTML = ""
    Hide('power2')
}


function Power4(){
    var card_count = CardCount()
    if(document.getElementById('form-power4-1').value == document.getElementById('form-power4-2').value){
        Swal.fire({
            icon: 'error',
            title: 'Please, select 2 different players',
            })
    }
    else if(card_count == objectives[4].cost) {
        socket.emit('power', {room: current_room, grade: 4, power1: document.getElementById("form-power4-1").value, power2: document.getElementById("form-power4-2").value})
        document.getElementById("form-power4-1").innerHTML = ""
        document.getElementById("form-power4-2").innerHTML = ""
        Hide('power4')
    }
    else{
        Swal.fire({
            icon: 'error',
            title: 'Please, select ' + objectives[4].cost + ' cards',
            })
    }
}

function IgnorePower4(){
    socket.emit('power', {room: current_room, grade: 4, power1: "ignore"})
    document.getElementById("form-power4-1").innerHTML = ""
    document.getElementById("form-power4-2").innerHTML = ""
    Hide('power4')
}

function Power5(){
    var card_count = CardCount()
    if(card_count == objectives[5].cost){
        socket.emit('power', {room: current_room, grade: 5, power: document.getElementById("form-power5").value, cost_card: hand_select, player: number_in_list})
        var index_looked = roles_list.indexOf(document.getElementById("form-power5").value)
        if(index_looked == 0){
            var role = "Traitor"
        }
        else{
            var role = "Crewmate"
        }
        Swal.fire({
            icon: 'info',
            title: role,
            text: document.getElementById("form-power5").value + " is a " + role
        })
        document.getElementById("form-power5").innerHTML = ""
        Hide('power5')
    }
    else{
        Swal.fire({
        icon: 'error',
        title: 'Please, select ' + objectives[5].cost + ' cards',
        })
    }
}

function IgnorePower5(){
    socket.emit('power', {room: current_room, grade: 5, power: "ignore"})
    document.getElementById("form-power5").innerHTML = ""
    Hide('power5')
}

function Power6(){
    var card_count = CardCount()
    if(card_count == objectives[6].cost) {
        socket.emit('power', {room: current_room, grade: 6, power: document.getElementById("form-power6").value})
        document.getElementById("form-power6").innerHTML = ""
        Hide('power6')
    }
    else{
        Swal.fire({
            icon: 'error',
            title: 'Please, select ' + objectives[6].cost + ' cards',
            })
    }
}

function IgnorePower6(){
    socket.emit('power', {room: current_room, grade: 6, power: "ignore"})
    document.getElementById("form-power6").innerHTML = ""
    Hide('power6')
}

function Power7(){
    var card_count = CardCount()
    if(card_count == objectives[7].cost) {
        socket.emit('power', {room: current_room, my_nb: number_in_list, grade: 7, power: document.getElementById("form-power7").value})
        document.getElementById("form-power7").innerHTML = ""
        Hide('power7')
    }
    else{
        Swal.fire({
            icon: 'error',
            title: 'Please, select ' + objectives[7].cost + ' cards',
            })
    }
}

function IgnorePower7(){
    socket.emit('power', {room: current_room, grade: 7, power: "ignore"})
    document.getElementById("form-power7").innerHTML = ""
    Hide('power7')
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
    var index = roles_list.indexOf(my_username)
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

socket.on('current-area',area => {
    current_area = area
    document.getElementById("area").innerHTML = "<h4>Era "+ area + "</h4>"
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
    var index = current_god
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
    div_container.innerHTML = "<h5><b>"+ objectives[index].name + "</br>" + "Power : " + objectives[index].value +"</br>Cost : " + objectives[index].cost + "<b/><h5/><p> " + objectives[index].power + " </p>"
    card.appendChild(div_container)

    objective.appendChild(card)
    Display("objective-to-do")
})

socket.on('result', (results) => {
    if(results.bool === true){
        Swal.fire({
            icon: 'success',
            title: 'This deamon has been beaten',
            text: 'The duo sent ' + results.power + ' energy'
          })
    }
    else{
        Swal.fire({
            icon: 'error',
            title: 'This deamon has not been beaten !',
            text: 'The duo sent ' + results.power + ' energy'
        })
        document.getElementById("objective-to-do").innerHTML = ""
        regress++
        var factor = regress * (100/4)
        document.getElementById("regress").style="width: "+ factor + "%"
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
        regress++
        var factor = regress * (100/5)
        document.getElementById("regress").style="width: "+ factor + "%"
        Swal.fire({
            icon: 'error',
            title: 'Equality',
            text: 'This deamon has been destroyed'
          })
    }
    else{
        progress++
        var factor = progress * (100/6)
        document.getElementById("progress").style="width: "+ factor + "%"
        Swal.fire({
            icon: 'success',
            title: 'Vote results',
            text: players_list[vote_results.index_max] + ' obtained ' + vote_results.max + ' votes and acquires ' + objectives[current_god].name
        })
    }
})

socket.on('power0', (player_number) => {
        if(number_in_list == player_number){
            var form = document.getElementById("form-power0")
            for(let i = 0; i < players_list.length ; i++){
                if(players_list[i] != my_username){
                    var option = document.createElement("option")
                    option.innerText = players_list[i]
                    form.appendChild(option)
                }
            }
            Display('power0')
        }
})

socket.on('power1', (player_number) => {
    if(number_in_list == player_number){
        var form = document.getElementById("form-power1")
        for (let i = 0 ; i < players_list.length ; i++){
            if(players_list[i] != my_username){
                var option = document.createElement("option")
                option.innerText = players_list[i]
                form.appendChild(option)
            }
        }
        Display('power1')
    }
})

socket.on('power2', (player_number) => {
    if(number_in_list == player_number){
        var form = document.getElementById("form-power2")
        for (let i = 0 ; i < players_list.length ; i++){
            if(players_list[i] != my_username){
                var option = document.createElement("option")
                option.innerText = players_list[i]
                form.appendChild(option)
            }
        }
        Display('power2')
    }
})

socket.on('power4', (player_number) => {
    if(number_in_list == player_number){
        var form = document.getElementById("form-power4-1")
        for (let i = 0 ; i < players_list.length ; i++){
            if(players_list[i] != my_username){
                var option = document.createElement("option")
                option.innerText = players_list[i]
                form.appendChild(option)
            }
        }
        var form = document.getElementById("form-power4-2")
        for (let i = 0 ; i < players_list.length ; i++){
            if(players_list[i] != my_username){
                var option = document.createElement("option")
                option.innerText = players_list[i]
                form.appendChild(option)
            }
        }
        Display('power4')
    }
})

socket.on('power5', (player_number) => {
    if(number_in_list == player_number){
        var form = document.getElementById("form-power5")
        for (let i = 0 ; i < players_list.length ; i++){
            if(players_list[i] != my_username){
                var option = document.createElement("option")
                option.innerText = players_list[i]
                form.appendChild(option)
            }
        }
        Display('power5')
    }
})

socket.on('power6', (player_number) => {
    if(number_in_list == player_number){
        var form = document.getElementById("form-power6")
        for (let i = 0 ; i < gods_dictionary.length ; i++){
            for (let j = 0; j < gods_dictionary[i].length ; j++){
                var option = document.createElement("option")
                option.innerText = objectives[gods_dictionary[i][j]].name
                form.appendChild(option)
            }
        }
        Display('power6')
    }
})

socket.on('power7', (player_number) => {
    if(number_in_list == player_number){
        var form = document.getElementById("form-power7")
        for (let i = 0 ; i < gods_dictionary.length ; i++){
            if(i != number_in_list){
                for (let j = 0; j < gods_dictionary[i].length ; j++){
                    var option = document.createElement("option")
                    option.innerText = objectives[gods_dictionary[i][j]].name
                    form.appendChild(option)
                }
            }
        }
        Display('power7')
    }
})