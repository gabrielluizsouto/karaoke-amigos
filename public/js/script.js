
socket.on('users-connected', (conectados)=>{
    var users_online = window.document.getElementById('users-online');
    users_online.innerText = "Users online: " + conectados; 
    
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
    updateActualSinger('');
});

//player-time
var player_time = window.document.getElementById('player-time');

socket.on('current-video-time', (curr, singer) =>{
    window.singer_time = curr;
    var time = new Date(curr.toFixed(2) * 1000).toISOString().substr(14, 5);
    var who_is_singing;
    if(singer == socket.id) {
        who_is_singing = 'Você está no tempo: ';
    } else {
        who_is_singing = 'O cantor está no tempo: ';
    }
    player_time.innerText = who_is_singing + time;
});

socket.on('adjust-video-time', (curr) =>{
    
    if(curr == undefined){
        curr = window.singer_time+0.4;
    }
    if(player){
        player.playVideo();
        player.seekTo(curr);
    }
    
});

// //audio capture
// var constraints = { audio: true };
// navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
//     var mediaRecorder = new MediaRecorder(mediaStream);
    
//     mediaRecorder.onstart = function(e) {
//         this.chunks = [];
//     };
//     mediaRecorder.ondataavailable = function(e) {
//         this.chunks.push(e.data);
//     };
//     mediaRecorder.onstop = function(e) {
//         var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
//         socket.emit('radio', blob);
//     };
    
    
    // Start song
    window.song_time_interval = '';
    window.start_song = document.getElementById('start-song');
    start_song.addEventListener('click', ()=>{
        socket.emit('i-started-sing', socket.id);
    });
    
    // Stop song
    window.stop_song = document.getElementById('pause-song');
    stop_song.addEventListener('click', ()=>{
        socket.emit('singer-paused-song', socket.id);
    });
    
// });


socket.on('allowed-to-sing', ()=>{
    //start_button.click();
    if(player) {
        player.playVideo();
        socket.emit('video-played');
    }
    updateActualSinger('Você está cantando');
    
    song_time_interval = setInterval(function() {
        if(window.player){
            //shows on screen the current time
            // var time = new Date(window.player.getCurrentTime().toFixed(2) * 1000).toISOString().substr(14, 5);
            // player_time.innerText = 'VOCE está cantando: ' + time;
            socket.emit('current-video-time', window.player.getCurrentTime());
            
            //adjust all users video time
            //if(parseInt(window.player.getCurrentTime())%30 == 0) {
                //socket.emit('adjust-video-time', window.player.getCurrentTime());
            //}
        }
    }, 1000);
});

socket.on('singer-not-allowed', ()=>{
    var alert_div = document.getElementById('alert-singer-singing');
    alert_div.innerText = 'ALGUEM ESTA CANTANDO AGORA';
    setTimeout(()=>{alert_div.innerText = ''}, 1500);

    if(player){
        player.loadVideoById(now_playing_song);
        setTimeout(()=>{player.playVideo()},2000);
    }
});

socket.on('singer-allowed-pause', ()=>{
    //stop_button.click();
    socket.emit('video-paused');
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

socket.on('singer-started', (singer) =>{
    //stop_button.click();
    document.getElementById('actual-singer').innerText = singer + ' está cantando';
});

socket.on('next-song', (musicVideoId) =>{
    //ligar a voz
    //start_button.click();
    
    //tocar proxima musica
    player.loadVideoById(musicVideoId);
    setTimeout(()=>{player.pauseVideo();}, 2000);
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

document.getElementById('rewind-1').addEventListener('click', ()=>{
    player.seekTo(window.player.getCurrentTime()-1);
});
document.getElementById('forward-1').addEventListener('click', ()=>{
    player.seekTo(window.player.getCurrentTime()+1);
});


function getVideoId(video_link){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = video_link.match(regExp);
    return match[7];
}

socket.on('load-musics-queue', (queue)=>{
    window.musics_queue = queue;
    updatePlaylist();
});

socket.on('load-actual-singer', (singer)=>{
    if(singer){
        updateActualSinger(singer + ' está cantando');
    } else {
        document.getElementById('actual-singer').innerText = '';
    }

});


function updateActualSinger(msg){
    document.getElementById('actual-singer').innerText = msg;
}

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

function updateUsersList(users){
    var users_list_div = document.getElementById('users-list');
    users_list_div.innerHTML = '';

    for (key in users) {
        // check if the property/key is defined in the object itself, not in parent
        if (users.hasOwnProperty(key)) {           
            var usr = document.createElement('p');
            usr.innerText = users[key];
            users_list_div.appendChild(usr);
        }
    }
}


function cleanMusicsQueue(){
    socket.emit('clean-music-queue');
}

function cleanActualSinger(){
    socket.emit('clean-actual-singer');
}


var change_nick_btn = document.getElementById('change-nick')
change_nick_btn.addEventListener('click', ()=>{
    docCookies.removeItem('nick');
    window.nick_modal.open();
});


function nickSetted(nick){
    socket.emit('nick-setted', socket.id, nick);
}


socket.on('update-users-list', (users)=>{
    updateUsersList(users);
})

socket.on('update-now-playing-song', (song)=>{
    now_playing_song = song;
})


var sync_btn = document.getElementById('sync-music');
sync_btn.addEventListener('click', function(){
    socket.emit('ask-to-adjust-video-time');
})



/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  Revision #1 - September 4, 2014
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|  https://github.com/madmurphy/cookies.js
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path[, domain]])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
    getItem: function (sKey) {
        if (!sKey) { return null; }
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                break;
                case String:
                sExpires = "; expires=" + vEnd;
                break;
                case Date:
                sExpires = "; expires=" + vEnd.toUTCString();
                break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!this.hasItem(sKey)) { return false; }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        if (!sKey) { return false; }
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
        return aKeys;
    }
};