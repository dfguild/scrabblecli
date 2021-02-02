import { Component } from '@angular/core';
import { GameService } from '../services/game.service';
import { GameState } from '../services/Game-dto';
import { TurnState } from '../services/TurnState';

@Component({
  selector: 'app-scores',
  templateUrl: './scores.component.html',
  styleUrls: ['./scores.component.css']
})
export class ScoresComponent {

  GameState = GameState;

  constructor(
    public readonly gmSvc: GameService,
  ) {}
}
