export type MultiplayerGame = "tic-tac-toe" | "connect-four" | "rps";
export type RoomStatus = "waiting" | "playing" | "finished";
export type PlayerMark = "X" | "O";
export type RpsChoice = "rock" | "paper" | "scissors";

export type Player = {
  id: string;
  name: string;
  mark: PlayerMark;
  connected: boolean;
  lastSeen: number;
  score: number;
};

export type RoomEvent = {
  id: string;
  message: string;
  createdAt: number;
};

export type TicTacToeState = {
  board: (PlayerMark | null)[];
  turn: PlayerMark;
  winner: PlayerMark | "draw" | null;
};

export type ConnectFourState = {
  board: (PlayerMark | null)[][];
  turn: PlayerMark;
  winner: PlayerMark | "draw" | null;
};

export type RpsState = {
  choices: Record<string, RpsChoice>;
  roundWinner: string | "draw" | null;
  round: number;
};

export type GameState = {
  ticTacToe: TicTacToeState;
  connectFour: ConnectFourState;
  rps: RpsState;
};

export type Room = {
  id: string;
  game: MultiplayerGame;
  players: Player[];
  status: RoomStatus;
  createdAt: number;
  updatedAt: number;
  state: GameState;
  events: RoomEvent[];
};

export type RoomAction =
  | { type: "join"; playerId: string; name: string }
  | { type: "heartbeat"; playerId: string }
  | { type: "leave"; playerId: string }
  | { type: "ticTacToeMove"; playerId: string; index: number }
  | { type: "connectFourMove"; playerId: string; column: number }
  | { type: "rpsChoice"; playerId: string; choice: RpsChoice }
  | { type: "rematch"; playerId: string };
