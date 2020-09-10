const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)


app.use('/public', express.static(__dirname + '/public'));  //serving all files in /public

app.get('/', (req, res) => {
    //console.log('GET in ' + __dirname + '/public/index.html');
    res.status(200).sendFile(__dirname + '/public/index.html');
});


var connected_users = [];
var musics_queue = [];
var actual_singer = undefined;
var now_playing_song = undefined;

io.on('connection', (socket) => {
    //push connected users
    connected_users.push(socket.id);
    //load musics queue
    socket.emit('load-musics-queue', musics_queue);
    socket.emit('load-now-playing', now_playing_song);

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

    socket.on('singer-paused-song', (socketId)=>{
        if(actual_singer && actual_singer == socketId){
            socket.emit('singer-allowed-pause');

            actual_singer = undefined;
        }
    });

    socket.on('current-video-time', (curr)=>{
        socket.broadcast.emit('current-video-time', curr+voice_delay);
    });

    socket.on('adjust-video-time', (curr)=>{
        socket.broadcast.emit('adjust-video-time', curr+voice_delay);
    });

    socket.on('added-music', (videoId)=>{
        musics_queue.push(videoId);
        io.emit('update-playlist', musics_queue);
    });

    socket.on('i-started-sing', (socketId) => {
        if(!actual_singer){
            actual_singer = socketId;
            io.emit('singer-started', socketId);
            socket.emit('allowed-to-sing', socketId);
        } else {
            if(actual_singer != socketId){
                socket.emit('singer-not-allowed', socketId);
            }
        }
    });

    socket.on('call-next-song', ()=>{
        if(musics_queue.length > 0){
            now_playing_song = musics_queue.shift();
            io.emit('next-song', now_playing_song);
            io.emit('update-playlist', musics_queue);
            actual_singer = undefined;
        }
    });
    
});  

var voice_delay = parseFloat(process.env.VOI_DELAY) || -0.3
const port = process.env.PORT || 5000;
server.listen(port, ()=>{
    console.log('listening on port ' + port + ', delay: ' + voice_delay);
});