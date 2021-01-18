import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GameListDTO } from '../Services/Game-List.dto';
import { ManageGamesSocketService } from '../Services/manage-games-socket.service';
import { GameState } from '../../scrabble/Services/Game-dto';
import { UserAuthService } from '../../services/user-auth.service';

@Component({
  selector: 'app-list-games',
  templateUrl: './list-games.component.html',
  styleUrls: ['./list-games.component.css']
})
export class ListGamesComponent {

  games: GameListDTO = [];
  profileJson: string = '';
  gameStateMessage: string[] = [];
  gamesRequested = false;

  constructor(
    readonly manageGamesSvc: ManageGamesSocketService,
    readonly router: Router,
  ){
    this.gameStateMessage[GameState.NotStarted] = 'Game Not Started';
    this.gameStateMessage[GameState.InPlay] = 'Game In Play';
    this.gameStateMessage[GameState.GameOver] = 'Game Over';
  }

  getGames(): boolean {
    if (!this.gamesRequested) {
      console.log('In ListGamesComponents getGames - subscribing to getGames$');
      this.manageGamesSvc.getGames();
      this.manageGamesSvc.getGames$().subscribe(games => {
        console.log(`got update with ${games.length} games`);
        this.games = games;
      });
      this.gamesRequested = true;
    }
    return true;
  }

  joinGame(gameId: number): void {
    for (const [i, v] of this.games.entries()) {
      if (v.gameId === gameId) {
        if (!this.games[i].gamePlayers.includes(this.manageGamesSvc.player)) {
          this.games[i].gamePlayers.push(this.manageGamesSvc.player);
          this.manageGamesSvc.joinGame(gameId);
        }
        break;
      }
    }
  }

  startGame(gameId: number): void {
    this.manageGamesSvc.gameId = gameId;
    if ( this.games.findIndex(g => ((g.gameId === gameId) && g.gamePlayers.includes(this.manageGamesSvc.player))) === -1 ) {
      // Game not joined
      console.log(`startGame - player ${this.manageGamesSvc.player} and game ${gameId} not found -> joining`)
      this.joinGame(gameId);
    }

    this.router.navigateByUrl('/scrabble');
  }
}