import {io} from "socket.io-client";

export const initSocket = async () => {
    const option = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
    };

    const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    return io(url, option);
}