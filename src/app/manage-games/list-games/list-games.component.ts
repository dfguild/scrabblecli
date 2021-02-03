import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { GameListDTO, GameListItem } from '../Services/Game-List.dto';
import { ManageGamesSocketService } from '../Services/manage-games-socket.service';
import { GameState } from '../../scrabble/services/Game-dto';


enum MyGameStatus {
  CanBeJoined,
  MyActiveGame,
  MyCompleteGame,
  NoList
}

interface MyGameListItem extends GameListItem {
  myGameStatus: MyGameStatus;
}

@Component({
  selector: 'app-list-games',
  templateUrl: './list-games.component.html',
  styleUrls: ['./list-games.component.css']
})
export class ListGamesComponent implements OnDestroy {

  games: MyGameListItem[] = [];
  gameStateMessage: string[] = [];
  gamesRequested = false;
  myGameStatus = MyGameStatus;
  subscription!: Subscription;
  GameState = GameState;

  constructor(
    readonly manageGamesSvc: ManageGamesSocketService,
    readonly router: Router,
  ){
    this.gameStateMessage[GameState.NotStarted] = 'Not Started';
    this.gameStateMessage[GameState.InPlay] = 'In Play';
    this.gameStateMessage[GameState.GameOver] = 'Game Over';
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getGames(): boolean {
    if (!this.gamesRequested) {
      console.log('In ListGamesComponents getGames - subscribing to getGames$');
      this.manageGamesSvc.getGames();
      this.subscription = this.manageGamesSvc.getGames$().subscribe(games => {
        console.log(`got update with ${games.length} games`);
        this.processGames(games);
      });
      this.gamesRequested = true;
    }
    return true;
  }

  private processGames(games: GameListDTO) {
    this.games = [];
    for (const g of games) {
      const mine = g.gamePlayers.includes(this.manageGamesSvc.player);
      const firstRound = (g.totalMoves <= g.gamePlayers.length);
      let status = MyGameStatus.NoList;
      if (!mine && !firstRound) continue;
      if (!mine && firstRound && (g.gamePlayers.length < 4)) status = MyGameStatus.CanBeJoined;
      if (mine && g.gameState === GameState.GameOver) status = MyGameStatus.MyCompleteGame;
      if (mine && (g.gameState !== GameState.GameOver)) status = MyGameStatus.MyActiveGame;
      const myGame = g as MyGameListItem;
      myGame.myGameStatus = status;
      this.games.push(myGame);
    }
    this.games.sort((a, b) => {
      const order = a.gameState - b.gameState;
      if (order === 0) {
        return a.totalMoves - b.totalMoves;
      } else {
        return order;
      }
    })
  }

  joinGame(id: string): void {
    for (const [i, v] of this.games.entries()) {
      if (v.id === id) {
        this.games[i].gamePlayers.push(this.manageGamesSvc.player);
        this.games[i].myGameStatus = MyGameStatus.MyActiveGame;
        this.manageGamesSvc.joinGame(id);
        break;
      }
    }
  }

  startGame(id: string): void {
    this.manageGamesSvc.id = id;
    if ( this.games.findIndex(g => ((g.id === id) && g.gamePlayers.includes(this.manageGamesSvc.player))) === -1 ) {
      // Game not joined
      console.log(`startGame - player ${this.manageGamesSvc.player} and game ${id} not found -> joining`)
      this.joinGame(id);
    }

    this.router.navigateByUrl('/scrabble');
  }

  getPlayerList(i: number): string {
    return this.games[i].gamePlayers.join(', ')
      .replace(this.games[i].gamePlayers[this.games[i].gameTurn],
          '<b>' + this.games[i].gamePlayers[this.games[i].gameTurn] + '</b>');
  }
}
