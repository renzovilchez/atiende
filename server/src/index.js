require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { initSocketIO } = require('./utils/socket');
const app = require('./app');

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }
});
initSocketIO(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 ATIENDE server running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV}`);
});