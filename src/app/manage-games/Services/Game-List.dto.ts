import { GameState } from '../../scrabble/services/Game-dto';

export class GameListItem {
  gameName: string = '';
  id: string = '';
  gamePlayers: string[] = [];
  gameTurn: number = 0;
  totalMoves: number = 0;
  gameState = GameState.NotStarted;
}

export type GameListDTO = GameListItem[];
