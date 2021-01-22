import { Component, OnInit, Input } from '@angular/core';
import { GameState } from '../services/Game-dto';
import { Player, GameService } from '../services/game.service';


@Component({
  selector: 'app-scores',
  templateUrl: './scores.component.html',
  styleUrls: ['./scores.component.css']
})
export class ScoresComponent implements OnInit {

  players: Player[] = [];
  turn: number = 0;
  winner: number = NaN;

  constructor(
    public readonly gmSvc: GameService,
  ) { }

  ngOnInit(): void {
    this.gmSvc.players$.subscribe((v) => {
      this.players = v;
    });

    this.gmSvc.turnState$.subscribe(v => {
      console.log(`Score:turnState subscribe turn=${v.turn}`);
      this.turn = v.turn;
      if (v.gameState === GameState.GameOver) {
        this.winner = this.players.reduce((prev, current) => {
          return (prev.score > current.score) ? prev : current;
        }).order;
      }
    });
  }

  isWinner(order: number): boolean {
    return (this.winner === order);
  }
}
