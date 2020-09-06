const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)


app.use('/public', express.static(__dirname + '/public'));  //serving all files in /public

app.get('/', (req, res) => {
    //console.log('GET in ' + __dirname + '/public/index.html');
    res.status(200).sendFile(__dirname + '/public/index.html');
});


var conectados = [];
io.on('connection', (socket) => {
   // console.log('Me conectei '+socket.id);
    conectados.push(socket.id);

    socket.on('msg', (msg)=>{
        //console.log(msg);
        socket.broadcast.emit('msg', socket.id+' connected');

        console.log('users online '+conectados.length+': '+conectados)
    })

    socket.on('disconnect', ()=>{
        //update the connected users array
        conectados = conectados.filter(function(value, index, arr){ return value != socket.id;});
        console.log('User disconnected '+socket.id)
    });

    socket.on('radio', function(blob) {
        // can choose to broadcast it to whoever you want
        socket.broadcast.emit('voice', blob);
        console.log('audio broadcasted');
    });

    socket.on('video-started', ()=>{
        socket.broadcast.emit('play-video');
    })
});  


server.listen(3030, ()=>{
    console.log('listening on port 3030')
});