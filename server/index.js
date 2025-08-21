const express = require('express');
const cors = require('cors');

const app = express();
const http = require('http');
const {Server} = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000'
    }
});

app.use(cors());
app.use(express.json());

const userSocketMap = {};
// {
//     "fowewefbiueb" : "vidur",
//     "uwdgyfgw" : "vidur"
// }

const getAllConnectedClients = (roomid) => {
    return Array.from(io.sockets.adapter.rooms.get(roomid) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            }
        }
    )
}

io.on('connection', (socket) => {
    // console.log(`User connected: ${socket.id}`);

    socket.on('join', ({roomid, username}) => {
        userSocketMap[socket.id] = username;
        socket.join(roomid);
        const clients = getAllConnectedClients(roomid);
        // notify to all user that new user joined
        clients.forEach(({socketId}) => {
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            })
        })
    })

    socket.on('code-change', ({roomid, code}) => {
        socket.in(roomid).emit('code-change', {
            code
        })
    })

    socket.on("sync-code", ({socketId, code}) => {
        io.to(socketId).emit("code-change", {code})
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomid) => {
            socket.in(roomid).emit('disconnected', {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            })
        })
        delete userSocketMap[socket.id];
    })
})



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// compile endpoint (placeholder)
app.post('/compile', async (req, res) => {
    try {
        const { code, language } = req.body || {};
        if (!code || !language) {
            return res.status(400).json({ error: 'code and language required' });
        }
        return res.json({ output: `Received ${language} code (${String(code).length} chars)` });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});