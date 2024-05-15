import { useEffect, useState, useCallback } from "react";
import { Container, TextField } from "@mui/material";
import Game from "./Game";
import socket from "./socket"
import CustomDialog from "./components/CustomDialog";
import InitGame from "./components/InitGame";

export default function App() {

  const [username, setUsername] = useState("");
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);
  
  const [room, setRoom] = useState("");
  const [orientation, setOrientation] = useState("");
  const [players, setPlayers] = useState([]);

  // reset states for new game
  const cleanup = useCallback(() => {
    setRoom("");
    setOrientation("");
    setPlayers("");
  }, []);

  useEffect (() => {
    socket.on("opponentJoined", (roomData) => {
      console.log("roomData", roomData);
      setPlayers(roomData.players);
    })
  }, []);

  return (
    <Container>
      <CustomDialog
        open = {!usernameSubmitted}
        handleClose = {() => setUsernameSubmitted(true)}
        title = "username"
        contentText = "Pick a username"
        handleContinue={() => {
          if (!username) return; // no username entered
          socket.emit("username", username); // send username socket data
          setUsernameSubmitted(true);
        }}
      >
        <TextField
          autoFocus //auto focus on text field
          margin = "dense"
          id = "username"
          label = "Username"
          name = "username"
          value = {username}
          required
          onChange = {(e) => setUsername(e.target.value)} // set username to value
          type = "text"
          fullWidth
          variant = "standard"
        />
      </CustomDialog>
      {room ? (
        <Game
          room = {room}
          orientation = {orientation}
          username = {username}
          players = {players}
          cleanup = {cleanup}
        />
      ) : (
        <InitGame
          setRoom = {setRoom}
          setOrientation = {setOrientation}
          setPlayers = {setPlayers}
        />
      )}
    </Container>
  );
}