const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);  
const allowedOrigins = [
  'https://haiaa.wuaze.com',           
  'https://chat-backend-mk6h.onrender.com'  
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 200000,    
  pingInterval: 30000
});


const userMap = {};
const users = {};
const userp = {};
let chunks = {};
const imageChunks = {};
const usere = {};
const usir = {};
const usss={};
let map2 = new Map();

io.on('connection', (socket) => {
  console.log('[Debug] New user connected:', socket.id);

  io.on('connection', (socket) => {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : socket.handshake.address || socket.conn.remoteAddress;

  console.log('User real IP:', ip);
});
  socket.on('register', (usi, ema, pasi) => {
    if (userp[usi] || usere[ema]) {
      const err = 'already';
      socket.emit('registered', err, ema, pasi);
    } else {
      if (pasi.length >= 8 || validemail(ema)) {
        userp[usi] = pasi;
        usere[ema] = pasi;
        usir[ema] = usi;
      }
      socket.emit('registered', usi, ema, pasi);
    }
    console.log(`username: ${usi}; password:${pasi}`);
  });

 const { name } = socket.handshake.auth;
  
  if (usss[name]) {
    console.log(`[Debug] Duplicate login detected for: ${name}`);
    socket.emit('disc');
  }

  socket.on('setname', (name, passwor) => {
    console.log(`[Debug] setname from ${socket.id}: ${name}`);
    if (userp[name] || usere[name]) {
      if (userp[name] && !usere[name]) {
        if (userp[name] === passwor) {
          if (validemail(name)) {
            userMap[socket.id] = usir[name];
            usss[usir[name]]=usir[name];
          } else {
            userMap[socket.id] = name;
            usss[usir[name]]=name;
          }
          if (validemail(name)) {
            const nai = usir[name];
            socket.emit('return', nai, socket.id);
          } else {
            socket.emit('return', name, socket.id);
          }
        } else {
          const err = "error";
          socket.emit('return', err, socket.id);
        }
      }
      if (!userp[name] && usere[name]) {
        if (usere[name] === passwor) {
          userMap[socket.id] = usir[name];
          socket.emit('return', usir[name], socket.id);
        } else {
          const err = "error";
          socket.emit('return', err, socket.id);
        }
      }
    } else {
      const err = "errori";
      socket.emit('return', err, passwor);
    }
  });

  socket.on('sentmessage', (message) => {
    const username = userMap[socket.id];
    console.log(`[Debug] ${username} sent: ${message}`);
    io.emit('returni', username, message);
    addMessage(username, message);
  });

  socket.on('type', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stop', () => {
    socket.broadcast.emit('stopped');
    console.log('Someone stopped typing');
  });

  socket.on('check', (uss) => {
    const messes = users[uss] || [];
    socket.emit('checked', messes);
  });

  socket.on('disconnect', () => {
      console.log(`[Debug] User disconnected: ${socket.id} (${userMap[socket.id]})`);
    delete userMap[socket.id];
    io.emit('ret', userMap); 
  });

  socket.on('users', () => {
    io.emit('ret', userMap);
  });

    socket.on('img', ({ id, index, total, data }) => {
    if (!imageChunks[id]) imageChunks[id] = [];
    imageChunks[id][index] = data;

    if (imageChunks[id].filter(Boolean).length === total) {
      const fullImage = imageChunks[id].join('');
      delete imageChunks[id];

      const user = userMap[socket.id];
      io.emit('imgs', user, fullImage);
    }
  });
  socket.on('location', (data) => {
    console.log('Received location:', data);
  });

});

function addMessage(username, message) {
  if (!users[username]) {
    users[username] = [];
  }
  users[username].push(message);
}

function validemail(ema) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(ema);
}


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
