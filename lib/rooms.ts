import { GameState, MultiplayerGame, Player, PlayerMark, Room, RoomAction, RpsChoice } from "./room-types";

const ROOM_TTL = 1000 * 60 * 60;
const DISCONNECT_AFTER = 1000 * 12;

type Store = Map<string, Room>;

const globalForRooms = globalThis as typeof globalThis & { __rooms?: Store };
const rooms = globalForRooms.__rooms ?? new Map<string, Room>();
globalForRooms.__rooms = rooms;

function initialState(): GameState {
  return {
    ticTacToe: { board: Array(9).fill(null), turn: "X", winner: null },
    connectFour: {
      board: Array.from({ length: 6 }, () => Array(7).fill(null)),
      turn: "X",
      winner: null,
    },
    rps: { choices: {}, roundWinner: null, round: 1 },
  };
}

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function prune() {
  const now = Date.now();
  for (const [id, room] of rooms) {
    room.players.forEach((player) => {
      player.connected = now - player.lastSeen < DISCONNECT_AFTER;
    });
    if (now - room.updatedAt > ROOM_TTL || room.players.length === 0) rooms.delete(id);
  }
}

function publicRoom(room: Room): Room {
  prune();
  return structuredClone(room);
}

function event(room: Room, message: string) {
  room.events = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, message, createdAt: Date.now() }, ...room.events].slice(0, 6);
  room.updatedAt = Date.now();
}

function markFor(players: Player[]): PlayerMark {
  return players.some((player) => player.mark === "X") ? "O" : "X";
}

export function createRoom(game: MultiplayerGame, playerId: string, name: string) {
  prune();
  let id = roomCode();
  while (rooms.has(id)) id = roomCode();
  const now = Date.now();
  const room: Room = {
    id,
    game,
    players: [{ id: playerId, name, mark: "X", connected: true, lastSeen: now, score: 0 }],
    status: "waiting",
    createdAt: now,
    updatedAt: now,
    state: initialState(),
    events: [{ id: `${now}-created`, message: `${name} created the room`, createdAt: now }],
  };
  rooms.set(id, room);
  return publicRoom(room);
}

export function getRoom(id: string) {
  prune();
  const room = rooms.get(id.toUpperCase());
  return room ? publicRoom(room) : null;
}

export function applyRoomAction(id: string, action: RoomAction) {
  prune();
  const room = rooms.get(id.toUpperCase());
  if (!room) return { error: "Room not found", status: 404 };

  const player = room.players.find((item) => item.id === action.playerId);
  if (action.type !== "join" && !player) return { error: "Player not in room", status: 403 };
  if (player) {
    player.lastSeen = Date.now();
    player.connected = action.type !== "leave";
  }

  if (action.type === "join") {
    const existing = room.players.find((item) => item.id === action.playerId);
    if (existing) {
      existing.name = action.name;
      existing.connected = true;
      existing.lastSeen = Date.now();
    } else {
      if (room.players.length >= 2) return { error: "Room is full", status: 409 };
      room.players.push({ id: action.playerId, name: action.name, mark: markFor(room.players), connected: true, lastSeen: Date.now(), score: 0 });
      event(room, `${action.name} joined`);
    }
    room.status = room.players.length === 2 ? "playing" : "waiting";
  }

  if (action.type === "leave" && player) event(room, `${player.name} disconnected`);
  if (action.type === "heartbeat") room.updatedAt = Date.now();
  if (action.type === "rematch") resetGame(room);
  if (action.type === "ticTacToeMove") ticTacToeMove(room, action.playerId, action.index);
  if (action.type === "connectFourMove") connectFourMove(room, action.playerId, action.column);
  if (action.type === "rpsChoice") rpsChoice(room, action.playerId, action.choice);

  return { room: publicRoom(room), status: 200 };
}

function resetGame(room: Room) {
  room.state = initialState();
  room.status = room.players.length === 2 ? "playing" : "waiting";
  event(room, "Rematch started");
}

function winner3(board: (PlayerMark | null)[]) {
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  for (const [a, b, c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? "draw" : null;
}

function ticTacToeMove(room: Room, playerId: string, index: number) {
  const player = room.players.find((item) => item.id === playerId);
  const state = room.state.ticTacToe;
  if (!player || room.game !== "tic-tac-toe" || state.winner || state.turn !== player.mark || state.board[index]) return;
  state.board[index] = player.mark;
  const winner = winner3(state.board);
  state.winner = winner;
  state.turn = state.turn === "X" ? "O" : "X";
  if (winner && winner !== "draw") player.score += 1;
  if (winner) room.status = "finished";
  event(room, winner ? `${winner === "draw" ? "Round ended in a draw" : `${player.name} won the round`}` : `${player.name} moved`);
}

function connectFourWinner(board: (PlayerMark | null)[][]) {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const mark = board[r][c];
      if (!mark) continue;
      for (const [dr, dc] of dirs) {
        if ([1, 2, 3].every((n) => board[r + dr * n]?.[c + dc * n] === mark)) return mark;
      }
    }
  }
  return board.every((row) => row.every(Boolean)) ? "draw" : null;
}

function connectFourMove(room: Room, playerId: string, column: number) {
  const player = room.players.find((item) => item.id === playerId);
  const state = room.state.connectFour;
  if (!player || room.game !== "connect-four" || state.winner || state.turn !== player.mark || column < 0 || column > 6) return;
  for (let row = 5; row >= 0; row--) {
    if (!state.board[row][column]) {
      state.board[row][column] = player.mark;
      const winner = connectFourWinner(state.board);
      state.winner = winner;
      state.turn = state.turn === "X" ? "O" : "X";
      if (winner && winner !== "draw") player.score += 1;
      if (winner) room.status = "finished";
      event(room, winner ? `${winner === "draw" ? "Connect Four draw" : `${player.name} connected four`}` : `${player.name} dropped a disc`);
      break;
    }
  }
}

function beats(a: RpsChoice, b: RpsChoice) {
  return (a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper");
}

function rpsChoice(room: Room, playerId: string, choice: RpsChoice) {
  if (room.game !== "rps") return;
  const state = room.state.rps;
  state.choices[playerId] = choice;
  const [a, b] = room.players;
  if (!a || !b || !state.choices[a.id] || !state.choices[b.id]) {
    event(room, "Choice locked");
    return;
  }
  const winner = beats(state.choices[a.id], state.choices[b.id]) ? a : beats(state.choices[b.id], state.choices[a.id]) ? b : null;
  state.roundWinner = winner?.id ?? "draw";
  if (winner) winner.score += 1;
  room.status = "finished";
  event(room, winner ? `${winner.name} won round ${state.round}` : `Round ${state.round} was a draw`);
}
