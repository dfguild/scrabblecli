import { Component, OnInit } from '@angular/core';
import { GameService } from '../services/game.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameState } from '../services/Game-dto';

@Component({
  selector: 'app-tile-rack',
  templateUrl: './tile-rack.component.html',
  styleUrls: ['./tile-rack.component.css']
})
export class TileRackComponent implements OnInit {

  player: string = '';
  myTurn: boolean = false;
  tilesRemaining: number = 0;
  gameOver: boolean = false;
  message: string = '';

  constructor(
    readonly gmSvc: GameService,
    private readonly snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.gmSvc.turnState$.subscribe(v => {
      console.log(`ScoreModule:new turnState update, tiles remaining: ${v?.tilesRemaining}`);
      this.myTurn = v.myTurn;
      this.tilesRemaining = v.tilesRemaining;
      this.message = v.gameMessage;
      (v) && (v.gameState === GameState.GameOver) && (this.gameOver = true);
    });
    this.player = this.gmSvc.player;
  }

  playMoveEvent(): void {
    try {
      this.gmSvc.playMove();
    } catch(e) {
      console.log(`in handleAction catch with msg: ${e.name}:${e.message}`)
      const sb = this.snackBar.open(`${e.name}: ${e.message}`, 'X' , {
        duration: 8000
      });

    }
  }

  resetMoveEvent(): void {
    this.gmSvc.resetMove();
  }

  passMoveEvent(): void {
    this.gmSvc.passMove();
  }
}
