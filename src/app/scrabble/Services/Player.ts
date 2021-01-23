import { PlayerDTO } from './Game-dto';

export class Player {
  playerName: string = '';
  order: number = 0;
  score: number = 0;

  constructor(p: PlayerDTO) {
    this.playerName = p.player_name;
    this.order = p.order;
    this.score = p.score;
  }
}
