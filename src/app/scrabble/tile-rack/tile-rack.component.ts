import { Component } from '@angular/core';
import { GameService } from '../services/game.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameState } from '../services/Game-dto';
import { MoveHandlerService } from '../services/move-handler.service';

@Component({
  selector: 'app-tile-rack',
  templateUrl: './tile-rack.component.html',
  styleUrls: ['./tile-rack.component.css']
})
export class TileRackComponent {
  GameState = GameState;

  constructor(
    readonly gmSvc: GameService,
    readonly mvSvc: MoveHandlerService,
    private readonly snackBar: MatSnackBar,
  ) { }

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
