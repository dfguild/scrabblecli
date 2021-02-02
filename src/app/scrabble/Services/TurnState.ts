import { GameState } from './Game-dto';

export class TurnState {
  public myOrder = 0;
  public turn = 0;
  public tilesRemaining = 0;
  public totalMoves = 0;
  public gameState = GameState.NotStarted;
  public gameMessage: string = '';

  get myTurn(): boolean {
    return ((this.gameState !== GameState.GameOver) && (this.myOrder === this.turn));
  }

  resetState() {
    this.myOrder = 0;
    this.turn=0;
    this.tilesRemaining =0;
    this.totalMoves = 0;
    this.gameState = GameState.NotStarted;
    this.gameMessage = '';
  }
}
