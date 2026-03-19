
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://ikdeksmp.fr:12000';

class SocketService {
    socket = null;

    connect() {
        if (this.socket) return;

        console.log(`[SocketService] Connecting to ${SOCKET_URL}...`);
        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('[SocketService] Connected! ID:', this.socket.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketService] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.log('[SocketService] Connection Error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

const socketService = new SocketService();
export default socketService;
