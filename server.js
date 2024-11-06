// server.js
const WebSocket = require('ws');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

wss.on('connection', (ws) => {
    console.log('새 연결이 수립되었습니다.');

    // 클라이언트로부터 메시지를 수신
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        // 수신한 메시지를 같은 방의 다른 클라이언트에게 전달
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    // 클라이언트가 연결을 종료할 때 로그 남김
    ws.on('close', () => {
        console.log('연결이 종료되었습니다.');
    });
});

console.log(`WebSocket 서버가 ${port} 포트에서 실행 중입니다.`);
