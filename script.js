// script.js
const signalingServer = new WebSocket("https://rtc-8ljw.onrender.com");

const startCallButton = document.getElementById('startCall');
const shareScreenButton = document.getElementById('shareScreen');
const endCallButton = document.getElementById('endCall');
const linkContainer = document.getElementById('linkContainer');

let localStream;
let peerConnection;

// 음성 통화 설정
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// 음성 통화 시작
startCallButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // 시그널링 서버 설정은 추가 필요
};

// 화면 공유 링크 생성
shareScreenButton.onclick = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenShareUrl = window.location.origin + '/share.html';

    // 링크 표시
    linkContainer.innerHTML = `<a href="${screenShareUrl}" target="_blank">화면 공유 링크</a>`;

    // 새 창을 통해 화면 공유를 보는 로직은 share.html 페이지에서 설정합니다.
};

// 통화 종료
endCallButton.onclick = () => {
    peerConnection.close();
    localStream.getTracks().forEach(track => track.stop());
};
