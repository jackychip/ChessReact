import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js'
import CustomDialog from './components/CustomDialog';
import socket from './socket';

import { Card, CardContent, List, ListItem, ListItemText, 
    ListSubheader, Stack, Typography, Box } from "@mui/material";

function Game({players, room, orientation, cleanup}) {
    const chess = useMemo(() => new Chess(), []);
    const [fen, setFen] = useState(chess.fen());
    const [over, setOver] = useState("");

    const makeAMove = useCallback(
        (move) => {
            try {
                const result = chess.move(move); //update chess instance
                setFen(chess.fen()); //update positions

                console.log("over, checkmate", chess.isGameOver(), chess.isCheckmate());

                if (chess.isGameOver()) {
                    if (chess.isCheckmate()) {
                        setOver(
                            `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
                        ); 
                    } else if (chess.isDraw()) { 
                        setOver("Draw"); 
                    } else {
                        //TO-DO: handle resignation or draw offer
                        setOver("Game over");
                    }
                }
                return result;
            }
            catch {
                return null;
            }
        },
        [chess]
    );

    function onDrop(sourceSquare, targetSquare) {
        const moveData = {
            from: sourceSquare,
            to: targetSquare,
            color: chess.turn(),
        };

        const move = makeAMove(moveData);

        // emit moveData to opponent
        socket.emit("move", {
            move,
            room
        });

        //handles legality of move
        return move != null;
    }

    useEffect(() => {
        socket.on("move", (move) => {
            makeAMove(move);
        })
    }, [makeAMove]);
    
    useEffect(() => {
        socket.on("playerDisconnected", (player) => {
            // game over when disconnected player
            setOver(`${player.username} has disconnected`);
        })
    }, []);

    useEffect(() => {
        socket.on("closeRoom", ({roomId}) => {
            if (roomId === room) {
                cleanup();
            }
        })
    }, [room, cleanup]);

    return (
        <Stack>
            <Card>
                <CardContent>
                    <Typography variant = "h4">Room ID: {room}</Typography>
                </CardContent>
            </Card>
            <Stack flexDirection = "row" sx = {{ pt: 2 }}>
                <div className="board" style = {{
                    maxWidth: 600,
                    maxHeight: 600,
                    flexGrow: 1
                }}>
                    <Chessboard 
                        position={fen} 
                        onPieceDrop={onDrop} 
                        boardOrientation = {orientation}
                        snapToCursor = {true}
                    />
                </div>
                {players.length > 0 && (
                    <Box>
                        <List>
                            <ListSubheader>Players</ListSubheader>
                            {players.map((p) => (
                                <ListItem key = {p.id}>
                                    <ListItemText primary = {p.username} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Stack>
            <CustomDialog
                open={Boolean(over)}
                title={over}
                contentText={over}
                handleContinue={() => {
                    socket.emit("closeRoom", {roomId: room});
                    cleanup();
                }}
            />
            <CustomDialog
                open={Boolean(over)}
                title={over}
                contentText={over}
                handleContinue={() => {
                    setOver("");
                }}
            />
        </Stack>
    )
}

export default Game;