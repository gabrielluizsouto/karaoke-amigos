socket.on('connect', ()=>{
    //window.document.getElementById('msgs').append('connected with id: '+socket.id+'\n');
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
    player_time.innerText = curr;
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
    var start_button = document.getElementById('turn-on-mic');
    start_button.addEventListener('click', ()=>{
        mediaRecorder.start();
        // Stop recording after 5 seconds and broadcast it to server
        interval = setInterval(function() {
            mediaRecorder.stop();
            mediaRecorder.start();
        }, 500);
    });

    // Stop recording (turn off mic)
    var stop_button = document.getElementById('turn-off-mic');
    stop_button.addEventListener('click', ()=>{
        clearInterval(interval);
        mediaRecorder.stop();
    });

    // Start song
    var song_time_interval;
    var start_song = document.getElementById('start-song');
    start_song.addEventListener('click', ()=>{
        start_button.click();
        if(player) {
            player.playVideo();
            socket.emit('video-played');
        }
        song_time_interval = setInterval(function() {
            if(window.player){
                //shows on screen the current time
                player_time.innerText = window.player.getCurrentTime();
                socket.emit('current-video-time', window.player.getCurrentTime());

                //adjust all users video time
                if(parseInt(window.player.getCurrentTime())%10 == 0) {
                    socket.emit('adjust-video-time', window.player.getCurrentTime());
                }
            }
        }, 1000);
    });

    // Stop song
    var stop_song = document.getElementById('stop-song');
    stop_song.addEventListener('click', ()=>{
        stop_button.click();
        if(player) {
            player.pauseVideo();
            socket.emit('video-paused');
        }
        clearInterval(song_time_interval);
    });
    
});

// When the client receives a voice message it will play the sound
socket.on('voice', function(arrayBuffer) {
    var blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
    var audio = document.createElement('audio');
    audio.src = window.URL.createObjectURL(blob);
    audio.play();
});


var change_music_btn = document.getElementById('change-music');
change_music_btn.addEventListener('click', ()=>{
    var video_link = document.getElementById('video-link').value;
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = video_link.match(regExp);

    socket.emit('changed-music', match[7]);
})

socket.on('change-music', (videoId)=>{
    player.loadVideoById(videoId);
    setTimeout(()=>{player.pauseVideo();}, 1500)
})





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
  player = new YT.Player('player', {
    height: '160',
    width: '340',
    videoId: '12szSsIKD0k',
    events: {
    }
  });
}