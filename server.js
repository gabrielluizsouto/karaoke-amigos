const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)


app.use('/public', express.static(__dirname + '/public'));  //serving all files in /public

app.get('/', (req, res) => {
    //console.log('GET in ' + __dirname + '/public/index.html');
    res.status(200).sendFile(__dirname + '/public/index.html');
});


var users_list = {};
var musics_queue = [];
var actual_singer = undefined;
var now_playing_song = undefined;

io.on('connection', (socket) => {
    //push connected users
    users_list[socket.id] = 'Anon';
    io.emit('update-users-list', users_list);
    
    //load musics queue
    socket.emit('load-musics-queue', musics_queue);
    socket.emit('load-now-playing', now_playing_song);
    socket.emit('load-actual-singer', users_list[actual_singer]);

        
    io.emit('users-connected', Object.keys(users_list).length);
    console.log('users online ' + Object.keys(users_list).length)
    //console.log(users_list)

    socket.on('disconnect', ()=>{
        delete users_list[socket.id];

        socket.broadcast.emit('users-connected', Object.keys(users_list).length);

        console.log('User disconnected '+socket.id)

        io.emit('update-users-list', users_list);

        //adjust if the disconnected player is the singer
        if(socket.id == actual_singer) {
            actual_singer = undefined;
            io.emit('pause-video');
        }
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
        io.emit('pause-video');
    });

    socket.on('singer-paused-song', (socketId)=>{
        if(actual_singer && actual_singer == socketId){
            socket.emit('singer-allowed-pause');

            actual_singer = undefined;
            socket.emit('load-actual-singer', actual_singer);
        }
    });

    socket.on('current-video-time', (curr)=>{
        io.emit('current-video-time', curr, actual_singer);
    });

    socket.on('adjust-video-time', (curr)=>{
        socket.broadcast.emit('adjust-video-time', curr);
    });

    socket.on('added-music', (videoId)=>{
        musics_queue.push(videoId);
        io.emit('update-playlist', musics_queue);
    });

    socket.on('i-started-sing', (socketId) => {
        if(!actual_singer){
            actual_singer = socketId;
            //console.log('actual singer: '+actual_singer);
            socket.broadcast.emit('singer-started', users_list[socketId]);
            socket.emit('allowed-to-sing', socketId);
        } else {
            if(actual_singer != socketId){
                socket.emit('singer-not-allowed');
            }
        }
    });

    socket.on('call-next-song', ()=>{
        if(musics_queue.length > 0){
            now_playing_song = musics_queue.shift();
            io.emit('next-song', now_playing_song);
            io.emit('update-playlist', musics_queue);
            io.emit('update-now-playing-song', now_playing_song);
            actual_singer = undefined;
            socket.emit('load-actual-singer', actual_singer);
            console.log('actual singer: '+actual_singer);
        }
    });


    socket.on('clean-music-queue', ()=>{
        musics_queue = [];
        io.emit('update-playlist', musics_queue);
    });

    socket.on('clean-actual-singer', ()=>{
        io.emit('pause-video');
        actual_singer = undefined;
    });

    socket.on('clean-now-playing-song', ()=>{
        now_playing_song = undefined;
        io.emit('update-now-playing-song', now_playing_song);
    });

    socket.on('nick-setted', (socketId, nick)=>{
        users_list[socketId] = nick;
        io.emit('update-users-list', users_list);
        console.log(users_list)
    });

    socket.on('disconnect-all-users', ()=>{
        for(key in users_list){
            io.sockets.connected[key].disconnect;
            console.log(io.sockets.connected[key].connected);
        }
    });


    socket.on('ask-to-adjust-video-time', ()=>{
        socket.emit('adjust-video-time', undefined);
    });

    socket.on('song-ended', ()=>{
        actual_singer=undefined;
    })
    
});  

var voice_delay = parseFloat(process.env.VOI_DELAY) || -0.3
const port = process.env.PORT || 5000;
server.listen(port, ()=>{
    console.log('listening on port ' + port + ', delay: ' + voice_delay);
});