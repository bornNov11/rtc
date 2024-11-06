const socket = io('/');
const videoGrid = document.getElementById('videoGrid');
const joinBtn = document.getElementById('joinBtn');
const audioBtn = document.getElementById('audioBtn');
const screenShareBtn = document.getElementById('screenShareBtn');

const peers = new Map();
let localStream = null;
let screenStream = null;
let isAudioEnabled = true;
let roomId = null;

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

async function createPeerConnection(targetId) {
  const peerConnection = new RTCPeerConnection(configuration);
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate, roomId, targetId);
    }
  };

  peerConnection.ontrack = (event) => {
    const video = document.createElement('video');
    video.id = `video-${targetId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = event.streams[0];
    videoGrid.appendChild(video);
  };

  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }

  return peerConnection;
}

joinBtn.addEventListener('click', async () => {
  roomId = prompt('참여할 방 ID를 입력하세요:');
  if (!roomId) return;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    
    const video = document.createElement('video');
    video.id = 'localVideo';
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = localStream;
    videoGrid.appendChild(video);

    socket.emit('join-room', roomId);
  } catch (err) {
    console.error('Media 접근 오류:', err);
  }
});

audioBtn.addEventListener('click', () => {
  if (localStream) {
    isAudioEnabled = !isAudioEnabled;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = isAudioEnabled;
    });
    audioBtn.textContent = isAudioEnabled ? '음성 끄기' : '음성 켜기';
  }
});

screenShareBtn.addEventListener('click', async () => {
  try {
    if (!screenStream) {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      const video = document.createElement('video');
      video.id = 'screenShare';
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = screenStream;
      videoGrid.appendChild(video);

      // 모든 피어에게 화면 공유 스트림 전송
      peers.forEach((peerConnection) => {
        screenStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, screenStream);
        });
      });

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      screenShareBtn.textContent = '화면 공유 중지';
    } else {
      stopScreenShare();
    }
  } catch (err) {
    console.error('화면 공유 오류:', err);
  }
});

function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
    const screenVideo = document.getElementById('screenShare');
    if (screenVideo) {
      screenVideo.remove();
    }
    screenShareBtn.textContent = '화면 공유';
  }
}

socket.on('user-connected', async (userId) => {
  console.log('User connected:', userId);
  const peerConnection = await createPeerConnection(userId);
  peers.set(userId, peerConnection);

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, roomId, userId);
});

socket.on('user-disconnected', (userId) => {
  console.log('User disconnected:', userId);
  const videoElement = document.getElementById(`video-${userId}`);
  if (videoElement) {
    videoElement.remove();
  }
  if (peers.has(userId)) {
    peers.get(userId).close();
    peers.delete(userId);
  }
});

socket.on('offer', async (offer, userId) => {
  const peerConnection = await createPeerConnection(userId);
  peers.set(userId, peerConnection);
  
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  socket.emit('answer', answer, roomId, userId);
});

socket.on('answer', async (answer, userId) => {
  const peerConnection = peers.get(userId);
  if (peerConnection) {
    await peerConnection.setRemoteDescription(answer);
  }
});

socket.on('ice-candidate', async (candidate, userId) => {
  const peerConnection = peers.get(userId);
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});