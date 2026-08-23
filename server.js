const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// قائمة بحفظ الـ PIN الخا بالاتصال
const activeRooms = new Map();

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on('connection', (socket) => {

  // تسجيل الشاشة وإنشاء PIN
  socket.on('registerScreen', () => {
    const pin = generatePin();
    socket.join(pin);
    activeRooms.set(socket.id, pin);
    socket.emit('screenRegistered', { pin });
  });

  // انضمام الريموت عبر الـ PIN
  socket.on('joinRoom', (pin) => {
    const rooms = Array.from(io.sockets.adapter.rooms.keys());
    if (rooms.includes(pin)) {
      socket.join(pin);
      socket.emit('joinStatus', { success: true, message: 'تم الاتصال بنجاح!' });
    } else {
      socket.emit('joinStatus', { success: false, message: 'رمز الـ PIN غير صحيح أو غير موجود!' });
    }
  });

  // التنقل بالأسهم
  socket.on('navigate', (data) => {
    io.to(data.pin).emit('remoteNavigate', data.dir);
  });

  // فتح التطبيقات (CarPlay / Home)
  socket.on('openApp', (data) => {
    io.to(data.pin).emit('stateUpdate', { currentApp: data.appName });
  });

  // تشغيل فيديو يوتيوب
  socket.on('playYoutube', (data) => {
    io.to(data.pin).emit('stateUpdate', { 
      currentApp: 'youtube', 
      youtubeId: data.videoId 
    });
  });

  socket.on('disconnect', () => {
    activeRooms.delete(socket.id);
  });
});

app.get('/remote', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
