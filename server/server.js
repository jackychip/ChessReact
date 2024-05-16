const express = require('express');
const { Server } = require('socket.io');
const { v4: uuidV4 } = require('uuid');
const http = require('http');

const app = express();  
const server = http.createServer(app);
const port = process.env.PORT || 8080;

const io = new Server(server, {
    cors: "*"
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});

const rooms = new Map();

io.on('connection', (socket) => {
    // client socket id
    console.log(socket.id, 'connected');

    // username event handling
    socket.on('username', (username => {
        console.log('username: ', username);
        socket.data.username = username;
    }));
    
    // creating room
    socket.on("createRoom", async (callback) => { // callback function from client
        const roomId = uuidV4(); // creating uuid for room
        await socket.join(roomId); // user who created room joins

        // add HashMap value (key: roomId, value: roomData)
        rooms.set(roomId, {
            roomId,
            players: [{ id: socket.id, username: socket.data.username }]
        });

        callback(roomId); // respond with roomId to client
    });

    // joining a room
    socket.on("joinRoom", async(args, callback) => {
        const room = rooms.get(args.roomId);
        let error, message;

        // check if room exists and has player
        if (!room) {
            error = true;
            message = "room doesn't exist!";
        }
        else if (room.length <= 0) {
            error = true;
            message = "room is empty!";    
        }
        else if (room.length >= 2) {
            error = true;
            message = "room is full!";
        }

        // error handling
        if (error) {
            // if client passed a callback, return error and message
            if (callback) {
                callback({error, message});
            }
            return;
        }

        await socket.join(args.roomId); // client joins room

        const roomUpdate = {
            ...room, 
            players: [
                ...room.players,
                { id: socket.id, username: socket.data.username },
            ],
        };

        rooms.set(args.roomId, roomUpdate);

        callback(roomUpdate);

        // emit opponentJoined event
        socket.to(args.roomId).emit("opponentJoined", roomUpdate);
    });

    socket.on("move", (data) => {
        // emit to rest of the sockets except emitting
        socket.to(data.room).emit("move", data.move);
    });

    // disconnections
    socket.on("disconnect", () => {
        const gameRooms = Array.from(rooms.values());

        gameRooms.forEach((room) => {
            const userInRoom = room.players.find((player) => player.id === socket.id);

            if (userInRoom) {
                if (room.players.length < 2) {
                    // if one player in room, close and exit
                    rooms.delete(room.roomId);
                    return;
                }
            }

            socket.to(room.roomId).emit("playerDisconnected", userInRoom);
        })
    })

    // closing room w/ disconnection
    socket.on("closeRoom", async (data) => {
        // alert others
        socket.to(data.roomId).emit("closeRoom", data);

        const clientSockets = await io.in(data.roomId).fetchSockets(); // get sockets

        clientSockets.forEach((s) => {
            s.leave(data.roomId); // disconnect users from room
        })

        rooms.delete(data.roomId); // delete room
    })
})