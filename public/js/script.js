socket.on('connect', ()=>{
    ////window.document.getElementById('msgs').append('connected with id: '+socket.id+'\n');
    socket.emit('i-connected', socket.id);
});
socket.on('users-connected', (conectados)=>{
    //console.log('users-connected');
    //update users online
    var users_online = window.document.getElementById('users-online');
    users_online.innerText = "Users online: " + conectados.length; 
    
})
socket.on('play-video', (msg) => {
    if(player) {
        player.playVideo();
    }
});
socket.on('pause-video', (msg) => {
    if(player) {
        player.pauseVideo();
    }
});

//player-time
var player_time = window.document.getElementById('player-time');

socket.on('current-video-time', (curr) =>{
    player_time.innerText = 'O cantor está no tempo : '+curr.toFixed(2);
});

socket.on('adjust-video-time', (curr) =>{
    player.playVideo();
    player.seekTo(curr);
});

//audio capture
var constraints = { audio: true };
navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
    var mediaRecorder = new MediaRecorder(mediaStream);

    mediaRecorder.onstart = function(e) {
        this.chunks = [];
    };
    mediaRecorder.ondataavailable = function(e) {
        this.chunks.push(e.data);
    };
    mediaRecorder.onstop = function(e) {
        var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
        socket.emit('radio', blob);
    };

    // Start recording (turn on mic)
    var interval;
    window.start_button = document.getElementById('turn-on-mic');
    start_button.addEventListener('click', ()=>{
        mediaRecorder.start();
        // Stop recording after 5 seconds and broadcast it to server
        interval = setInterval(function() {
            mediaRecorder.stop();
            mediaRecorder.start();
        }, 500);

        document.getElementById('mic-state').innerText = 'Mic ON';
    });

    // Stop recording (turn off mic)
    window.stop_button = document.getElementById('turn-off-mic');
    stop_button.addEventListener('click', ()=>{
        clearInterval(interval);
        mediaRecorder.stop();

        document.getElementById('mic-state').innerText = 'Mic OFF';
    });

    // Start song
    window.song_time_interval = '';
    window.start_song = document.getElementById('start-song');
    start_song.addEventListener('click', ()=>{
        socket.emit('i-started-sing', socket.id);
    });

    // Stop song
    window.stop_song = document.getElementById('stop-song');
    stop_song.addEventListener('click', ()=>{
        socket.emit('singer-paused-song', socket.id);
    });
    
});


socket.on('allowed-to-sing', ()=>{
    start_button.click();
    if(player) {
        player.playVideo();
        socket.emit('video-played');
    }
    song_time_interval = setInterval(function() {
        if(window.player){
            //shows on screen the current time
            player_time.innerText = 'VOCE está cantando: ' + window.player.getCurrentTime().toFixed(2);
            socket.emit('current-video-time', window.player.getCurrentTime());

            //adjust all users video time
            if(parseInt(window.player.getCurrentTime())%10 == 0) {
                socket.emit('adjust-video-time', window.player.getCurrentTime());
            }
        }
    }, 1000);
});

socket.on('singer-not-allowed', ()=>{
    var alert_div = document.getElementById('alert-singer-singing');
    alert_div.innerText = 'ALGUEM ESTA CANTANDO AGORA';
    setTimeout(()=>{alert_div.innerText = ''}, 1500);
});

socket.on('singer-allowed-pause', ()=>{
    stop_button.click();
    if(player) {
        player.pauseVideo();
        socket.emit('video-paused');
    }
    clearInterval(song_time_interval);    
});

// When the client receives a voice message it will play the sound
socket.on('voice', function(arrayBuffer) {
    var blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
    var audio = document.createElement('audio');
    audio.src = window.URL.createObjectURL(blob);
    audio.play();
});


var add_music_btn = document.getElementById('add-music');
add_music_btn.addEventListener('click', ()=>{
    var videoId = getVideoId(document.getElementById('video-link').value);

    socket.emit('added-music', videoId);
})


socket.on('update-playlist', (musics)=>{
    musics_queue = musics;
    updatePlaylist();
})

socket.on('singer-started', (socketId) =>{
    stop_button.click();

    document.getElementById('actual-singer').innerText = socketId;
});

socket.on('next-song', (musicVideoId) =>{
    //ligar a voz
    start_button.click();

    //tocar proxima musica
    player.loadVideoById(musicVideoId);
    setTimeout(()=>{player.pauseVideo();}, 2000);
    
    //update playlist
    updatePlaylist();
});


window.next_song = document.getElementById('next-song');
next_song.addEventListener('click', ()=>{
    socket.emit('call-next-song');
});


socket.on('load-now-playing', (videoId)=>{
    window.now_playing_song = videoId;
});

//youtube player API
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
          
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
    var now_playing_song = window.now_playing_song || '3Uj-F8Ff7eU';

    player = new YT.Player('player', {
        height: '160',
        width: '340',
        videoId: now_playing_song,
        events: {
        }
    });

    player.addEventListener("onStateChange", function(state){
        //video ended
        if(state.data === 0){
            // the video is end, do something here.
            socket.emit('song-ended');
        }
    });
}



function getVideoId(video_link){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = video_link.match(regExp);
    return match[7];
}

socket.on('load-musics-queue', (queue)=>{
    window.musics_queue = queue;
    updatePlaylist();
});


function updatePlaylist(){
    var musics_queue_div = document.getElementById('musics-queue-div');
    //clean actual child
    musics_queue_div.innerHTML = '';

    //insert child
    musics_queue.forEach((item)=>{
        var mus = document.createElement('p');
        mus.innerText = item.title || 'User: '+ socket.id + ' added: ' + item;
        musics_queue_div.appendChild(mus);
    });
}