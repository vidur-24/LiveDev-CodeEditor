import {io} from "socket.io-client";

export const initSocket = async () => {
	const option = {
		forceNew: true,
		reconnectionAttempts: Infinity,
		timeout: 10000,
		transports: ['websocket', 'polling'],
	};

	const isDev = process.env.NODE_ENV === 'development';
	const baseUrl = isDev ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : '');
	return io(baseUrl, option);
}