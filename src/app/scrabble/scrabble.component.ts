import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { ManageGamesSocketService } from '../manage-games/Services/manage-games-socket.service';
import { GameService } from './services/game.service';

@Component({
  templateUrl: './scrabble.component.html',
  styleUrls: ['./scrabble.component.css']
})
export class ScrabbleComponent implements OnInit, OnDestroy {
  private routesub: any;

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

    this.routesub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.onRouteAway();
      }
    })
  }

  onRouteAway() {
    console.log('ScrabbleComponent:onRoute')
    this.gameSvc.onExit();
  }

  ngOnDestroy(): void {
    console.log(`ScrabbleComponent:onDestroy cleaning up`);
    this.routesub.unsubscribe();
  }
}
