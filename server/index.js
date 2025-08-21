require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

const server = http.createServer(app);
const io = new Server(
	server,
	isProduction
		? {}
		: {
			cors: {
				origin: clientOrigin,
			},
		}
);

if (!isProduction) {
	app.use(cors({ origin: clientOrigin }));
}
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
			};
		}
	);
};

io.on('connection', (socket) => {
	// console.log(`User connected: ${socket.id}`);

	socket.on('join', ({ roomid, username }) => {
		userSocketMap[socket.id] = username;
		socket.join(roomid);
		const clients = getAllConnectedClients(roomid);
		// notify to all user that new user joined
		clients.forEach(({ socketId }) => {
			io.to(socketId).emit('joined', {
				clients,
				username,
				socketId: socket.id,
			});
		});
	});

	socket.on('code-change', ({ roomid, code }) => {
		socket.in(roomid).emit('code-change', {
			code,
		});
	});

	socket.on('sync-code', ({ socketId, code }) => {
		io.to(socketId).emit('code-change', { code });
	});

	socket.on('disconnecting', () => {
		const rooms = [...socket.rooms];
		rooms.forEach((roomid) => {
			socket.in(roomid).emit('disconnected', {
				socketId: socket.id,
				username: userSocketMap[socket.id],
			});
		});
		delete userSocketMap[socket.id];
	});
});

// API routes
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

// Serve React build if in production OR build exists
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
const hasClientBuild = fs.existsSync(path.join(clientBuildPath, 'index.html'));

if (isProduction || hasClientBuild) {
	app.use(express.static(clientBuildPath));
	// Use a RegExp to avoid path-to-regexp star parsing issues in Express 5
	// Exclude Socket.IO and API endpoints from SPA fallback
	app.get(/^\/(?!socket\.io|compile)(.*)$/i, (req, res) => {
		res.sendFile(path.join(clientBuildPath, 'index.html'));
	});
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log(`NODE_ENV=${process.env.NODE_ENV || ''} | isProduction=${isProduction} | serveStatic=${isProduction || hasClientBuild}`);
	console.log(`Static path: ${clientBuildPath} | exists=${hasClientBuild}`);
});