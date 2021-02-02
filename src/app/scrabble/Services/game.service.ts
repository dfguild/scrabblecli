import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GameState } from './Game-dto';
import { MoveHandlerService } from './move-handler.service';
import { DragDropService } from './drag-drop.service';
import { TileBagService } from './tile-bag.service';
import { MoveSocketService } from './move-socket.service';
import { Game } from './Game';
import { Square } from './Square';
import { TurnState } from './TurnState';
import { Player } from './Player';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  game: Game;

  socketReady$!: Observable<boolean>;

  constructor(
    private readonly dragDropService: DragDropService,
    private readonly mvHandlerService: MoveHandlerService,
    private readonly mvSocketService: MoveSocketService,
    private readonly tileBagService: TileBagService,
    ) {
      this.game = new Game(this.tileBagService, this.mvSocketService);
      this.mvHandlerService.setGameObject(this.game);
      this.dragDropService.setGameObject(this.game);
      this.socketReady$ = mvSocketService.socketReady$;
      this.mvSocketService.getGameDTO().subscribe(g => this.game.gameDtoEventHandler(g));
      this.mvSocketService.getGameJoinUpdates().subscribe(g => {
        this.game.processGameJoins(g);
        if (!this.game.turnState.myTurn) this.resetMove();
      });
    }

  get grid$(): Observable<Square[][]> {
    return this.game.grid$;
  }

  get tileRack$(): Observable<Square[]> {
    return this.game.tileRack$;
  }

  get turnState$(): Observable<TurnState> {
    return this.game.turnState$;
  }

  get players$(): Observable<Player[]> {
    return this.game.players$;
  }

  startGame(player: string, id: string) {
    this.game.resetState();
    this.game.initialLoad = true;
    this.game.playerName = player;
    this.game.id = id;
    this.game.turnState.gameState = GameState.InPlay;
    console.log(`GameService:startGame calling startGame on SocketSvc with player: ${player} and id: ${id}`);
    this.mvSocketService.startGame(player, id);
  }

  playMove(): Promise<boolean> {
    this.game.turnState.gameState = GameState.InPlay;
    const score = this.mvHandlerService.processMove();
    this.game.players[this.game.turnState.myOrder].score += score;
    this.game.tileRack = this.tileBagService.getTiles(this.game.tileRack);
    this.game.passCounter = 0; //Valid move; reset pass counter -- used to determine if all pass and game is over.
    this.game.turnState.gameMessage = `${this.game.playerName} scored:${score}`;
    this.game.lastMove.map(sq => sq.sqClasses.lastMove = false);
    this.mvHandlerService.currentMove.map(sq => sq.setLastMove());
    return this.updateGame();
  }

  resetMove():void {
    console.log('GameService:resetMove entered')
    //Move current move tiles back to rack
    this.mvHandlerService.currentMove.forEach(sq=>{
      this.dragDropService.insertShiftTileRight(0, sq.letter[0]);
      sq.letter = '';
    });
    this.mvHandlerService.currentMove = [];
  }

  passMove(): Promise<boolean> {
    console.log('GameService:passmove entered')
    this.resetMove();
    this.game.passCounter++;
    this.game.turnState.gameMessage = `${this.game.playerName} passed`;
    return this.updateGame();
  }

  swapTiles(selected: boolean[]): void{
    this.game.tileRack = this.tileBagService.swapTiles(this.game.tileRack, selected);
    this.game.passCounter = 0; //swap isn't a pass
    this.game.turnState.gameMessage = `${this.game.playerName} swapped ${selected.filter(x => x).length} tiles`;
    this.passMove();
  }

  private async updateGame(): Promise<boolean> {
    this.checkGameOver();
    this.incrementMove();
    this.game.turnState.tilesRemaining = this.tileBagService.tileBag.length;
    this.game.updateTurnState(); //send to disable buttons until new DTO received
    const success = await this.mvSocketService.updateGame(this.game.createGameDTO());
    if (success) this.mvHandlerService.commitMove();

    if (success) {
      this.game.updatePlayers();  //update the scores since no longer processing my own DTO
      this.game.updateGrid();
      return success;
    } else {
      this.game.revertMove();
      throw new Error('Unable to write to server; resetting move');
    }
  }

  private incrementMove() {
    this.game.turnState.totalMoves++;
    if (this.game.turnState.gameState != GameState.GameOver) {
      this.game.turnState.turn = ((this.game.turnState.turn + 1) % this.game.players.length);
    }
  }

  private checkGameOver(): void {
    if (this.tileBagService.getNumTiles(this.game.tileRack) === 0 && this.tileBagService.tileBag.length === 0) {
      console.log(`GameService:checkGameOver - Setting Game Over`);
      this.updateEndOfGameScores();
      this.game.turnState.gameState = GameState.GameOver;
    }else if(this.game.passCounter === this.game.players.length && this.game.players.length > 1) {
      console.log(`GameService:checkGameOver - Setting Game Over`);
      this.game.turnState.gameState = GameState.GameOver;
    }
  }

  private updateEndOfGameScores(): void {
    for (const p of this.game.preMoveGameDTO.players) {
      if (p.order === this.game.turnState.myOrder) continue;
      const rackValue = this.game.assignPointValues(p.tiles).map(s => s.letterValue).reduce((prev, next) => prev + next, 0);
      console.log(`GameService:updateEndOfGameScores for player ${p.order} moving ${rackValue} points`);
      this.game.players[this.game.turnState.myOrder].score += rackValue;
      this.game.players[p.order].score -= rackValue;
    }
  }
}
