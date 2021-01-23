import { GameState } from './Game-dto';

export class TurnState {
  public myOrder = 0;
  private turn_ = 0;
  public tilesRemaining = 0;
  public totalMoves = 0;
  public gameState = GameState.NotStarted;
  public gameMessage: string = '';

  set turn(t: number) {
    this.turn_ = t;
  }

  get turn(): number {
    return this.turn_;
  }

  get myTurn(): boolean {
    return ((this.gameState !== GameState.GameOver) && (this.myOrder === this.turn_));
  }
}
