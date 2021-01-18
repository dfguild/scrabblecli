import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerNamesDTO } from '../app/games-list/Services/playerNames.dto';
import { GameListDTO } from '../app/games-list/Services/Game-List.dto';
import { SignOnSocketService } from '../app/games-list/Services/signon-socket.service';

@Component({
  selector: 'app-signon',
  templateUrl: './signon.component.html',
  styleUrls: ['./signon.component.css']
})
export class SignonComponent implements OnInit {

  playerName = '';
  headerMessage = '';
  addItemType = 'Player';
  listMode = true;
  players: PlayerNamesDTO = [];
  games: GameListDTO = [];

  constructor(
      public readonly signOnSvc: SignOnSocketService,
      private readonly router: Router,
      private readonly snackBar: MatSnackBar,
      ) {}

  ngOnInit(): void {
    this.signOnSvc.player = '';
    this.headerMessage = this.signOnSvc.player ? 'Add Game' : 'Add Player';
    this._getPlayers();
  }

  // event handler when add item is called from header
  raiseAddItem(): void {
    this.listMode = false;
  }

  // dialog to add item submit event handler
  addNewItem(itemName: string): void {
    this.listMode = true;

    if (this.addItemType === 'Player') {
      if (this.players.indexOf(itemName.toUpperCase()) !== -1 ) {
        console.log(`Duplicate Player Name`)
          this.snackBar.open(`Player: ${itemName.toUpperCase()} already used. Choose another name.`, '' , {
            duration: 8000
          });
        return;
      }
      this.signOnSvc.addPlayer(itemName.toUpperCase()).subscribe();
      this._getGames();
      this.headerMessage = 'Add Game';
    }else{
      if (this.games.findIndex( g => g.gameName === itemName.toUpperCase() ) !== -1 ) {
        console.log(`Duplicate Game Name`)
          this.snackBar.open(`Game: ${itemName.toUpperCase()} already used. Choose another name.`, '' , {
            duration: 8000
          });
        return;
      }
      this.signOnSvc.createGame(itemName).subscribe((glDTO) => {
      this.games = glDTO; });
    }
    this.addItemType = this.signOnSvc.player ? 'Game' : 'Player';
  }

  playerSelected(player: string ): void {
    this.signOnSvc.player = player;
    this.headerMessage = 'Add Game';
    this.addItemType = 'Game';
    this._getGames();
  }

  joinGame(gameId: number): void {
    this.listMode = true;

    for (const [i, v] of this.games.entries()) {
      if (v.gameId === gameId) {
        if (!this.games[i].gamePlayers.includes(this.playerName)) {
          this.games[i].gamePlayers.push(this.playerName);
          this.signOnSvc.joinGame(gameId).subscribe((glDTO) => {
            this.games = glDTO; });
        }
        break;
      }
    }
  }

  startGame(gameId: number): void {
    this.signOnSvc.gameId = gameId;
    if ( this.games.findIndex(g => ((g.gameId === gameId) && g.gamePlayers.includes(this.signOnSvc.player))) === -1 ) {
      // Game not joined
      console.log(`startGame - player ${this.signOnSvc.player} and game ${gameId} not found -> joining`)
      this.joinGame(gameId);
    }

    this.router.navigateByUrl('/scrabble');
  }

  private _getPlayers(): void {
    this.signOnSvc.getPlayers().subscribe(players => this.players = players);
    this.players.sort();
  }

  private _getGames(): void {
    this.signOnSvc.getGames().subscribe(games => this.games = games);
  }
}
