import { io } from "socket.io-client";

const socket = io("localhost:8080"); // initialize websocket connection

export default socket;