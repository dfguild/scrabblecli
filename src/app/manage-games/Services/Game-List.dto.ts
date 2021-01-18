import { GameState } from '../../scrabble/Services/Game-dto';

export class GameListItem {
  gameName: string = '';
  gameId: number = 0;
  gamePlayers: string[] = [];
  gameTurn: number = 0;
  totalMoves: number = 0;
  gameState = GameState.NotStarted;
}

export type GameListDTO = GameListItem[];
