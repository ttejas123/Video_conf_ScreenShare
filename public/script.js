const socket = io('/');  //socket connection
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
let peers = {}, peerss = {}, userIDtoRemove, currentPeer = [];

var peer = new Peer(undefined,{   //we undefine this because peer server create it's own user it
  //path: '/peerjs',
	host: '/',
	port: '3001'
});

let myVideoStream, ScreemStream, removingClass ;
navigator.mediaDevices.getUserMedia({     //by using this we can access user device media(audio, video) 
	video: true,
	audio: false
}).then(stream =>{                        //in this promice we sended media in stream
    addVideoStream(myVideo, stream);
    myVideoStream = stream;

    peer.on('call', call =>{               //here user system answer call and send there video stream to us
    	var acceptsCall = confirm("Videocall incoming");

      if(acceptsCall){
          console.log("answered");        
    	    call.answer(stream);               //via this send video stream to caller
          const video = document.createElement('video');
      
          //for normal calls
        	call.on('stream', userVideoStream =>{
               addVideoStream(video, userVideoStream);  
    	    });
          //currentPeer = call.peerConnection;
          currentPeer.push(call.peerConnection);
          // Handle when the call finishes
          call.on('close', function(){
                video.remove();
                alert("The videocall has finished");
          });
       // use call.close() to finish a call
       }else{
        console.log("Call denied !");
       }
    });

    socket.on('user-connected', (userId)  =>{   //userconnected so we now ready to share 
      console.log('user ID fetch connection: '+ userId); //video stream
      connectToNewUser(userId, stream);        //by this fuction which call user
    })

});


//if someone try to join room
peer.on('open', async id =>{
   await socket.emit('join-room', ROOM_ID, id); //if someone join room send roomid and userid to server
   // socket.emit('screen_share', ROOM_ID, id); //if someone join room send roomid and userid to server
   await socket.emit('join_screenCast', ROOM_ID, id);
})

socket.on('user-disconnected', userId =>{   //userdisconnected so we now ready to stopshare 
      if(peers[userId]) peers[userId].close();
      console.log('user ID fetch Disconnect: '+ userId); 
              //by this fuction which call user to stop share
}); 


const connectToNewUser = (userId, stream) =>{
	   console.log('User-connected :-'+userId);
     let call =  peer.call(userId, stream);       //we call new user and sended our video stream to him
     //currentPeer = call.peerConnection;
     const video = document.createElement('video');
     call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream);  // Show stream in some video/canvas element.
      })
      call.on('close', () =>{
      	video.remove()
      })
      //currentPeer = call.peerConnection;
      peers[userId] = call;
      currentPeer.push(call.peerConnection);
     console.log(currentPeer);
}


 const addVideoStream = (video, stream) =>{      //this help to show and append or add video to user side
	video.srcObject = stream;
  video.controls = true;
	video.addEventListener('loadedmetadata', () =>{
		video.play();
	})
	videoGrid.append(video);
}

//to Mute or Unmute Option method
const muteUnmute = () =>{
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  }else{
    setUnmuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setUnmuteButton = ()=>{
   const html = `<i class="fas fa-microphone"></i>
                <span>Mute</span>`;
   document.querySelector('.Mute__button').innerHTML = html;
   console.log("You are Unmuted");
}

const setMuteButton = () =>{
  const html = `<i class="fas fa-microphone-slash" style="color:red;"></i>
                <span>Unmute</span>`;
  document.querySelector('.Mute__button').innerHTML = html;
  console.log("Muted");
}

//Video ON or OFF
const videoOnOff = () =>{
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    unsetVideoButton();
  }else{
    setVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setVideoButton = ()=>{
   const html = `<i class="fas fa-video"></i>
                <span>Stop Video</span>`;
   document.querySelector('.Video__button').innerHTML = html;
   console.log("Cammera Mode ON");
}

const unsetVideoButton = () =>{
  const html = `<i class="fas fa-video-slash" style="color:red;"></i>
                <span>Start Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;
  console.log("Cammera Mode OFF");
}

//code for disconnect from client
const disconnectNow = ()=>{
    window.location = "http://localhost:3000/";   
}

//code to share url of roomId
const share =() =>{
  var share = document.createElement('input'),
  text = window.location.href;
  
  console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand('copy');
  document.body.removeChild(share);
  alert('Copied');
 }



const screenshare = () =>{
  // if (check) {
 navigator.mediaDevices.getDisplayMedia({ 
     video:{
       cursor:'always'
     },
     audio:{
            echoCancellation:true,
            noiseSupprission:true
     }

 }).then(stream =>{
     let videoTrack = stream.getVideoTracks()[0];
         videoTrack.onended = function(){
           stopScreenShare();
         }
         for (let x=0;x<currentPeer.length;x++){
           
           let sender = currentPeer[x].getSenders().find(function(s){
              return s.track.kind == videoTrack.kind;
            })
            
            sender.replaceTrack(videoTrack);
       }
   
  })
  
 }

function stopScreenShare(){
  let videoTrack = myVideoStream.getVideoTracks()[0];
  for (let x=0;x<currentPeer.length;x++){
          let sender = currentPeer[x].getSenders().find(function(s){
              return s.track.kind == videoTrack.kind;
            }) 
          sender.replaceTrack(videoTrack);
  }       
}
