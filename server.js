const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// إعداد WebSocket مع حزم Ping/Pong لضمان عدم فصل الاتصال
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// خدمة الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// إدارة اتصالات الأجهزة والربط
let screenSocket = null;
let currentPin = null;

function generatePin() {
  return Math.floor(1000 + Math.log10(Math.random() * 9000) * 1000).toString().substring(0, 4);
}

io.on('connection', (socket) => {
  // تسجيل الشاشة الأصلية
  socket.on('registerScreen', () => {
    screenSocket = socket;
    currentPin = Math.floor(1000 + Math.random() * 9000).toString();
    socket.emit('screenRegistered', { pin: currentPin });
  });

  // التحقق من رمز PIN من الجوال (الريموت)
  socket.on('verifyPin', (pin) => {
    if (pin === currentPin) {
      socket.emit('pinVerified', { success: true });
    } else {
      socket.emit('pinVerified', { success: false });
    }
  });

  // توجيه الأوامر من الريموت إلى الشاشة
  socket.on('changeState', (data) => {
    io.emit('stateUpdate', data);
  });

  socket.on('navigate', (dir) => {
    io.emit('remoteNavigate', dir);
  });

  socket.on('disconnect', () => {
    if (socket === screenSocket) {
      screenSocket = null;
    }
  });
});

// توجيه أي مسار غير معروف إلى صفحة index.html لتجنب خطأ Not Found
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// استقبال البورت الديناميكي من منصة الاستضافة
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
