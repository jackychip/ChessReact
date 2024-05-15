import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import CustomDialog from "./CustomDialog";
import socket from "../socket";

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [roomInput, setRoomInput] = useState('');
    const [roomError, setRoomError] = useState('');

    return (
        <Stack
            justifyContent = "center"
            alignItems = "center"
            sx = {{ py: 1, height: "100vh" }}
        >
            <CustomDialog
                open = {roomDialogOpen}
                handleClose = {() => setRoomDialogOpen(false)}
                title = "Select Room to Join"
                contextText = "Enter a valid room ID to join"
                handleContinue = {() => {
                    // joining a room
                    if (!roomInput) return; // if input is invalid
                    socket.emit("joinRoom", { roomId: roomInput }, (r) => {
                        // r = response from server (callback)
                        if (r.error) return setRoomError(r.message); // error handling
                        console.log("response: ", r);
                        setRoom(r.roomId);
                        setPlayers(r.players);
                        setOrientation("black");
                        setRoomDialogOpen(false);
                    });
                }}
            >
                <TextField
                    autoFocus
                    margin="dense"
                    id="room"
                    label="Room ID"
                    name="room"
                    value={roomInput}
                    required
                    onChange={(e) => setRoomInput(e.target.value)}
                    type="text"
                    fullWidth
                    variant="standard"
                    error={Boolean(roomError)}
                    helperText={!roomError ? 'Enter a room ID' : `Invalid room ID: ${roomError}` }
                />
            </CustomDialog>
            {/* Button for creating room */}
            <Button
                variant = "contained"
                onClick = {() => {
                    socket.emit("createRoom", (r) => {
                        console.log(r);
                        setRoom(r);
                        setOrientation("white");
                    })
                }}
            >
                Create Room
            </Button>
            {/* Button for joining room */}
            <Button
                onClick = {() => {
                    setRoomDialogOpen(true);
                }}
            >
                Join Room
            </Button>
        </Stack>
    )
}