import { io } from "socket.io-client";

// Remplace http://localhost par l'IP de ton PC si tu tests sur smartphone réel.
const SOCKET_URL = "http://10.0.2.2:3000"; // Android emulator
// const SOCKET_URL = "http://localhost:3000"; // Web / expo client sur même machine

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

// Valeurs partagées avec l'app
socket.currentRoomId = null;

export default socket;
