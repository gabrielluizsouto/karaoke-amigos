const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)


app.use('/public', express.static(__dirname + '/public'));  //serving all files in /public

app.get('/', (req, res) => {
    //console.log('GET in ' + __dirname + '/public/index.html');
    res.status(200).sendFile(__dirname + '/public/index.html');
});

var users_queue = [];

var connected_users = [];
io.on('connection', (socket) => {
   // console.log('Me conectei '+socket.id);
    connected_users.push(socket.id);

    socket.on('i-connected', (sockId)=>{
        //console.log('i- connected');
        socket.broadcast.emit('new-user-connected', sockId);
        io.emit('users-connected', connected_users);

        console.log('users online '+connected_users.length+': '+connected_users)
    })

    socket.on('disconnect', ()=>{
        //update the connected users array
        connected_users = connected_users.filter(function(value, index, arr){ return value != socket.id;});
        
        socket.broadcast.emit('users-connected', connected_users);

        console.log('User disconnected '+socket.id)
    });

    socket.on('radio', function(blob) {
        // can choose to broadcast it to whoever you want
        socket.broadcast.emit('voice', blob);
        //console.log('audio broadcasted');
    });

    socket.on('video-played', ()=>{
        socket.broadcast.emit('play-video');
    });

    socket.on('video-paused', ()=>{
        socket.broadcast.emit('pause-video');
    });

    socket.on('current-video-time', (curr)=>{
        socket.broadcast.emit('current-video-time', curr);
    });

    var voice_delay = process.env.VOI_DELAY || -0.5
    socket.on('adjust-video-time', (curr)=>{
        socket.broadcast.emit('adjust-video-time', curr+voice_delay);
    });

    socket.on('changed-music', (videoId)=>{
        io.emit('change-music', videoId);
    })
});  

const port = process.env.PORT || 5000;
server.listen(port, ()=>{
    console.log('listening on port ' + port);
});