import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { ManageGamesSocketService } from '../manage-games/Services/manage-games-socket.service';
import { GameService } from './services/game.service';

@Component({
  templateUrl: './scrabble.component.html',
  styleUrls: ['./scrabble.component.css']
})
export class ScrabbleComponent implements OnInit, OnDestroy {

  constructor(
    public readonly manageGameSocketSvc: ManageGamesSocketService,
    private readonly gameSvc: GameService,
    private readonly router: Router,
  ){}

  ngOnInit(): void {
    const player = this.manageGameSocketSvc.player;
    const id = this.manageGameSocketSvc.id;

    if (player === '' || id === '') {
      this.router.navigateByUrl('/signon');
      return;
    }

    console.log(`ScabbleComponent:OnInit - calling startGame with pl=${player} gm=${id}`);
    this.gameSvc.startGame(player, id);
  }

  ngOnDestroy(): void {
    console.log(`ScrabbleComponent:onDestroy cleaning up`);
    this.gameSvc.onExit();
  }
}
