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

  resetState() {
    this.myOrder = 0;
    this.turn_ =0;
    this.tilesRemaining =0;
    this.totalMoves = 0;
    this.gameState = GameState.NotStarted;
    this.gameMessage = '';
  }
}
