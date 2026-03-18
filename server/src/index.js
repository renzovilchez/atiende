require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter')
const Redis = require('ioredis')
const { initSocketIO } = require('./utils/socket');
const app = require('./app');

const httpServer = http.createServer(app);

const pubClient = new Redis({ host: process.env.REDIS_HOST || 'redis', port: 6379 })
const subClient = pubClient.duplicate()

const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }
})

io.adapter(createAdapter(pubClient, subClient))
initSocketIO(io)

app.locals.io = io

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`🚀 ATIENDE server running on port ${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV}`);
});