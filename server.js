const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// تقديم جميع ملفات مجلد public بما فيها remote.html
app.use(express.static(path.join(__dirname, 'public')));

let currentPin = "1234"; // pin افتراضي لسرعة الربط بدون تعليق

io.on('connection', (socket) => {
  
  // عند فتح الشاشة
  socket.on('registerScreen', () => {
    currentPin = Math.floor(1000 + Math.random() * 9000).toString();
    socket.emit('screenRegistered', { pin: currentPin });
  });

  // عند إرسال الرمز من الجوال
  socket.on('verifyPin', (pin) => {
    if (pin === currentPin) {
      socket.emit('pinVerified', { success: true });
    } else {
      socket.emit('pinVerified', { success: false });
    }
  });

  // بث الأوامر فوراً لجميع المتصلين بدون تأخير
  socket.on('changeState', (data) => {
    io.emit('stateUpdate', data);
  });

  socket.on('navigate', (dir) => {
    io.emit('remoteNavigate', dir);
  });
});

// فتح صفحة الريموت مباشرة عند طلب /remote
app.get('/remote', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

// فتح الشاشة الرئيسية لأي مسار آخر
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
