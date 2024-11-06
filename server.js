const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    const room = rooms.get(roomId) || new Set();
    room.add(socket.id);
    rooms.set(roomId, room);
    
    socket.to(roomId).emit('user-connected', socket.id);
    
    socket.on('disconnect', () => {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });

  socket.on('offer', (offer, roomId, targetId) => {
    socket.to(targetId).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, roomId, targetId) => {
    socket.to(targetId).emit('answer', answer, socket.id);
  });

  socket.on('ice-candidate', (candidate, roomId, targetId) => {
    socket.to(targetId).emit('ice-candidate', candidate, socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});