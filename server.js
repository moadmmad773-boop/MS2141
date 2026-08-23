const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// تخزين حالات الشاشات حسب رمز الغرفة (Pin Code)
const carRooms = {};

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on('connection', (socket) => {
  // 1. تسجيل الشاشة وتوليد غرفة جديدة
  socket.on('registerScreen', () => {
    const pin = generatePin();
    socket.join(pin);
    carRooms[pin] = {
      currentApp: 'home',
      youtubeId: ''
    };
    socket.emit('screenRegistered', { pin });
  });

  // 2. ربط الجوال بالغرفة باستخدام الـ PIN
  socket.on('joinRoom', (pin) => {
    if (carRooms[pin]) {
      socket.join(pin);
      socket.emit('joinStatus', { success: true, pin });
      io.to(pin).emit('stateUpdate', carRooms[pin]);
    } else {
      socket.emit('joinStatus', { success: false, message: 'رمز الربط غير صحيح!' });
    }
  });

  // 3. التوجيه وأوامر التحكم للسيارة المحددة
  socket.on('navigate', ({ pin, dir }) => {
    if (pin) io.to(pin).emit('remoteNavigate', dir);
  });

  socket.on('openApp', ({ pin, appName }) => {
    if (pin && carRooms[pin]) {
      carRooms[pin].currentApp = appName;
      io.to(pin).emit('stateUpdate', carRooms[pin]);
    }
  });

  socket.on('playYoutube', ({ pin, videoId }) => {
    if (pin && carRooms[pin]) {
      carRooms[pin].youtubeId = videoId;
      carRooms[pin].currentApp = 'youtube';
      io.to(pin).emit('stateUpdate', carRooms[pin]);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
