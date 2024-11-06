// share.js
const sharedScreen = document.getElementById('sharedScreen');
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let peerConnection = new RTCPeerConnection(config);

// 시그널링 서버와 연결 - WebSocket 사용 (주소는 환경에 맞게 설정 필요)
const signalingServer = new WebSocket("wss://your-signaling-server.com");

// 시그널링 서버에서 메시지를 수신
signalingServer.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "offer") {
        // 화면을 보는 사용자는 화면 공유자의 offer를 수신
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

        // answer 생성 및 전송
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingServer.send(JSON.stringify({ type: "answer", answer }));
    } else if (data.type === "candidate") {
        // ICE 후보 수신
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};

// 화면 공유 스트림 수신
peerConnection.ontrack = (event) => {
    sharedScreen.srcObject = event.streams[0];
};

// ICE 후보 생성 시 서버로 전송
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        signalingServer.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
    }
};
