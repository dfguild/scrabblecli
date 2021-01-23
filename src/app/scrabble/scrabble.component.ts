import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ManageGamesSocketService } from '../manage-games/Services/manage-games-socket.service';
import { GameService } from './services/game.service';
import { Player } from './services/Player';
import { Square } from './services/Square';

@Component({
  templateUrl: './scrabble.component.html',
  styleUrls: ['./scrabble.component.css']
})
export class ScrabbleComponent implements OnInit {

  loadingMessage: boolean = true;
  public player = '';
  public id = '';
  public gameName = '';
  public gridSquares: Square[][] = [];
  public tileRack: Square[] = [];
  public turn: number = 0;
  public players: Player[] = [];
  public myPlayerNum = 0;
  public myTurn = false;

  constructor(
    public readonly manageGameSocketSvc: ManageGamesSocketService,
    private readonly gameSvc: GameService,
    private readonly router: Router,
  ){}

  ngOnInit(): void {
    this.player = this.manageGameSocketSvc.player;
    this.id = this.manageGameSocketSvc.id;

    if (this.player === '' || this.id === '') {
      this.router.navigateByUrl('/signon');
      return;
    }

    console.log(`ScabbleComponent:OnInit - calling startGame with pl=${this.player} gm=${this.id}`);
    this.gameSvc.startGame(this.player, this.id);
    this.gameSvc.tileRack$.subscribe(v => this.tileRack = v);
  }

  gotoGames(): void {
    this.manageGameSocketSvc.id = '';
    this.router.navigateByUrl('/signon');
  }
}
