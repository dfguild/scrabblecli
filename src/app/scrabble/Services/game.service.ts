import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { GameDTO, PlayerDTO, GameState } from './Game-dto';
import { Square } from './Square';
import { MoveHandlerService } from './move-handler.service';
import { DragDropService } from './drag-drop.service';
import { TileBagService } from './tile-bag.service';
import { MoveSocketService } from './move-socket.service';
import { Player } from './Player';
import { TurnState } from './TurnState';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  player: string = '';
  game: string = '';
  id: string = '';
  passCounter: number = 0;
  lastGameDTO = {} as GameDTO;
  initialLoad: boolean = false;
  private playersDTO: PlayerDTO[] = []; //keep for end of game scoring
  socketReady$!: Observable<boolean>;

  public grid: Square[][] = [];
  private gridSubject = new BehaviorSubject<Square[][]>([]);
  public grid$ = this.gridSubject.asObservable();

  public tileRack: Square[] = [];
  private tileRackSubject = new BehaviorSubject<Square[]>([]);
  public tileRack$ = this.tileRackSubject.asObservable();

  public turnState = new TurnState;
  private turnStateSubject = new BehaviorSubject<TurnState>(this.turnState);
  public turnState$ = this.turnStateSubject.asObservable();

  public players: Player[] = [];
  private playersSubject = new BehaviorSubject<Player[]>([]);
  public players$ = this.playersSubject.asObservable();

  public currentMove: Square[] = [];

  constructor(
    private readonly dragDropService: DragDropService,
    private readonly mvHandlerService: MoveHandlerService,
    private readonly mvSocketService: MoveSocketService,
    private readonly tileBagService: TileBagService,
    ) {
      this.mvHandlerService.setGameService(this);
      this.dragDropService.setGameService(this);
      this.socketReady$ = mvSocketService.socketReady$;
      this.mvSocketService.getGameDTO().subscribe(g => this.processGameMoveDTO(g));
      this.mvSocketService.getGameJoinUpdates().subscribe(g => this.processGameJoins(g));
    }

  startGame(player: string, id: string) {
    this.resetState();
    this.initialLoad = true;
    this.player = player;
    this.id = id;
    this.turnState.gameState = GameState.InPlay;
    console.log(`GameService:startGame calling startGame on SocketSvc with player: ${player} and id: ${id}`);
    this.mvSocketService.startGame(player, id);
  }

  //Received an update from the Server with a new move (including this players)
  private processGameMoveDTO(gmDTO: GameDTO) {
    console.log(`GameService:processDTO with ${JSON.stringify(gmDTO)}`);
    if (gmDTO.id != this.id) return;  // update for different game;
    this.lastGameDTO = gmDTO;
    this.mvSocketService.totalMovesReceived = gmDTO.totalMoves;
    let myOrder: number|undefined;
    if (this.initialLoad) {
      this.game = gmDTO.gameName;
      myOrder = gmDTO.players.find(pDto => pDto.player_name === this.player)?.order;
      if (myOrder === undefined ) throw new Error(`Player: ${this.player} not found in server data, exiting...`);
      this.turnState.myOrder = myOrder;
    }
    this.passCounter = gmDTO.passCounter;

    // if player is only player and made move -- make it next player to disable buttons until player joins
    if (gmDTO.turn === 0 && gmDTO.totalMoves ===1) {
      this.turnState.turn = gmDTO.turn + 1;
    } else {
      this.turnState.turn = gmDTO.turn;
    }
    this.turnState.totalMoves = gmDTO.totalMoves;
    this.turnState.gameState = gmDTO.gameState;
    this.turnState.gameMessage = gmDTO.gameMessage;
    console.log(`sending turnState=${JSON.stringify(this.turnState)}`)

    //process players array
    this.updatePlayers(gmDTO.players.map(p => new Player(p)));
    this.playersDTO = gmDTO.players;

    (this.initialLoad) && (this.tileRack = this.assignPointValues( gmDTO.players[this.turnState.myOrder].tiles, 99 ));
    if (this.tileRack.length === 7) { this.tileRack.push(new Square('', 99, 7)) } // create 8th square to assist moving tiles around
    this.updateTileRack();

    this.updateGrid(gmDTO.grid.map((r,i)=>this.assignPointValues(r, i, true)));

    console.log(`GameService:processDto - setting tileBag length=${gmDTO.remainingTiles.length}`)
    this.tileBagService.tileBag = this.assignPointValues(gmDTO.remainingTiles);
    this.turnState.tilesRemaining = this.tileBagService.tileBag.length;
    console.log(`GameService:processDto - setting turnState tileBag length to:${this.turnState.tilesRemaining}`)
    this.updateTurnState();
    this.initialLoad = false;
  }

  processGameJoins(gmDTO: GameDTO): void {
    //Update all players except me
    console.log(`GameService:processGameJoins`);
    if (gmDTO.id != this.id) return;  // update for different game;
    gmDTO.players.filter(p =>p.order != this.turnState.myOrder).map(p => this.players[p.order] = new Player(p));
    this.updatePlayers();

    this.tileBagService.tileBag = this.assignPointValues(gmDTO.remainingTiles);
    this.turnState.tilesRemaining = this.tileBagService.tileBag.length;
    console.log(`GameService:processDto - setting turnState tileBag length to:${this.turnState.tilesRemaining}`);

    this.turnState.turn = gmDTO.turn;
    if (!this.turnState.myTurn) {
      //Handle case where new player joins and gets the move.
      this.resetMove();  // reset move incase user started move
      this.updateGrid();
      this.updateTileRack();
    }

    this.updateTurnState();
  }

  playMove(): Promise<boolean> {
    this.turnState.gameState = GameState.InPlay;
    this.players[this.turnState.myOrder].score += this.mvHandlerService.processMove();
    this.tileRack = this.tileBagService.getTiles(this.tileRack);
    this.passCounter = 0; //Valid move; reset pass counter -- used to determine if all pass and game is over.
    return this.updateGame();
  }

  resetMove():void {
    console.log('GameService:resetMove entered')
    //Move current move tiles back to rack
    this.currentMove.forEach(sq=>{
      this.dragDropService.insertShiftTileRight(0, sq.letter[0]);
      sq.letter = '';
    });
    this.currentMove = [];
  }

  passMove(): Promise<boolean> {
    console.log('GameService:passmove entered')
    this.resetMove();
    this.passCounter++;
    return this.updateGame();
  }

  swapTiles(selected: boolean[]): void{
    this.tileRack = this.tileBagService.swapTiles(this.tileRack, selected);
    this.passMove();
  }

  private async updateGame(): Promise<boolean> {
    this.checkGameOver();
    this.incrementMove();
    this.updateTurnState(); //send to disable buttons until new DTO received

    const success = await this.mvSocketService.updateGame(this.createGameDTO());
    if (success) this.mvHandlerService.commitMove();

    return success;
  }

  private incrementMove() {
    this.turnState.totalMoves++;
    if (this.turnState.gameState != GameState.GameOver) {
      this.turnState.turn = ((this.turnState.turn + 1) % this.players.length);
    }
  }

  private checkGameOver(): void {
    if (this.tileBagService.getNumTiles(this.tileRack) === 0 && this.tileBagService.tileBag.length === 0) {
      console.log(`GameService:checkGameOver - Setting Game Over`);
      this.updateEndOfGameScores();
      this.turnState.gameState = GameState.GameOver;
    }else if(this.passCounter === this.players.length && this.players.length > 1) {
      console.log(`GameService:checkGameOver - Setting Game Over`);
      this.turnState.gameState = GameState.GameOver;
    }
  }

  // !!FIX - DOESN'T WORK -- get points on everyone elses rack and add to my score as winner
  private updateEndOfGameScores(): void {
    let letters: string[] = [];
    this.playersDTO.splice(this.turnState.myOrder, 1)
      .map(p => letters = letters.concat(p.tiles.filter(l => !(l))));
    this.players[this.turnState.myOrder].score +=
      this.assignPointValues(letters).map(t => t.letterValue).reduce((prev, next) => prev + next);
  }

  private resetState() {
    this.updateTurnState();
    this.grid.map(r => r.map(s => s.letter=''));
    this.players=[];
    this.tileRack = [];
    this.updateGrid();
    this.updateTurnState();
    this.updateTileRack();
    this.updatePlayers();
  }

  //Helpers to Update data Subjects for Components

  // Public for use by DragDropService;
  updateGrid(g?: Square[][]): void {
    (g) && (this.grid = g);
    this.gridSubject.next(this.grid);
  }

  // Public for use by DragDropService;
  updateTileRack(tr?: Square[]): void {
    (tr) && (this.tileRack = tr);
    this.tileRackSubject.next(this.tileRack);
  }

  private updatePlayers(p?: Player[]): void {
    (p) && (this.players = p);
    this.playersSubject.next(this.players);
  }

  private updateTurnState(ts?: TurnState): void {
    (ts) && (this.turnState = ts);
    this.turnStateSubject.next(this.turnState);
  }

  private createGameDTO(): GameDTO {
    const gDto = new GameDTO();
    gDto.id = this.id;
    gDto.gameName = this.game;
    gDto.remainingTiles = this.tileBagService.tileBag.map(o => o.letter);
    gDto.grid = this.grid.map(row => row.map(s => s.letter));
    gDto.turn = this.turnState.turn;
    gDto.totalMoves = this.turnState.totalMoves;
    gDto.gameMessage = this.turnState.gameMessage;
    gDto.gameState = this.turnState.gameState;
    gDto.passCounter = this.passCounter;

    //Update my player only
    const pDto = new PlayerDTO();
    pDto.score = this.players[this.turnState.myOrder].score;
    pDto.order = this.turnState.myOrder;
    pDto.player_name = this.player;
    pDto.tiles = this.tileRack.map(s => s.letter);
    gDto.players.push(pDto);

    console.log(`GameService:createGameDTO GameDTO=${JSON.stringify(gDto)}`);
    return gDto;
  }

  //helper function to assign tile values to array of letters to create Tile[]
  private assignPointValues(tiles: string[], row: number = 0, scored: boolean = false ): Square[] {
  console.log(`GameService:assignPointValues tiles=${tiles.join()} row=${row}`)
    return tiles.map( (l, i) => new Square(l, row, i, scored));
  }
}
