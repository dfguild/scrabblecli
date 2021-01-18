import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { GameDTO, PlayerDTO, GameState } from './Game-dto';
import { Square } from './Square';
import { MoveHandlerService } from './move-handler.service';
import { DragDropService } from './drag-drop.service';
import { TileBagService } from './tile-bag.service';
import { MoveSocketService } from './move-socket.service';

export class Player {
  playerName: string = '';
  order: number = 0;
  score: number = 0;

  constructor(p: PlayerDTO) {
    this.playerName = p.player_name;
    this.order = p.order;
    this.score = p.score;
  }
}

export class TurnState {
  public myOrder = 0;
  private turn_ = 0;
  public tilesRemaining = 0;
  public totalMoves = 0;
  public gameState = GameState.NotStarted;
  public gameMessage: string = '';

  set turn(t: number) {
    this.turn_ = t;
  }

  get turn(): number {
    return this.turn_;
  }

  get myTurn(): boolean {
    return ((this.gameState !== GameState.GameOver) && (this.myOrder === this.turn_));
  }
}

@Injectable({
  providedIn: 'root'
})
export class GameService {

  player: string = '';
  game: string = '';
  gameId: number = NaN;
  passCounter: number = 0;
  initialLoad: boolean = false;

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
    }

  startGame(player: string, gameId: number) {
    this.initialLoad = true;
    this.player = player;
    this.gameId = gameId;
    this.turnState.gameState = GameState.InPlay;
    this.mvSocketService.getGameDTO().subscribe(g => this.processGameMoveDTO(g));
    console.log(`GameService:startGame calling startGame on SocketSvc with player: ${player} and gameId: ${gameId}`);
    this.mvSocketService.getGameJoinUpdates().subscribe(g => this.processGameJoins(g));
    this.mvSocketService.startGame(player, gameId);
  }

  //Received an update from the Server with a new move (including this players)
  private processGameMoveDTO(gmDTO: GameDTO) {
    console.log(`GameService:processDTO with ${JSON.stringify(gmDTO)}`);
    let myOrder: number|undefined;
    if (this.initialLoad) {
      this.game = gmDTO.gameName;
      myOrder = gmDTO.players.find(pDto => pDto.player_name === this.player)?.order;
      if (myOrder === undefined ) throw new Error(`Player: ${this.player} not found in server data, exiting...`);
      this.turnState.myOrder = myOrder;
    }
    this.passCounter = gmDTO.passCounter;
    this.turnState.turn = gmDTO.turn;
    this.turnState.totalMoves = gmDTO.totalMoves;
    this.turnState.gameState = gmDTO.gameState;
    this.turnState.gameMessage = gmDTO.gameMessage;
    console.log(`sending turnState=${JSON.stringify(this.turnState)}`)

    //process players array
    this.updatePlayers(gmDTO.players.map(p => new Player(p)));

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
    gmDTO.players.filter(p =>p.order != this.turnState.myOrder).map(p => this.players[p.order] = new Player(p));
    this.updatePlayers();

    this.tileBagService.tileBag = this.assignPointValues(gmDTO.remainingTiles);
    this.turnState.tilesRemaining = this.tileBagService.tileBag.length;
    console.log(`GameService:processDto - setting turnState tileBag length to:${this.turnState.tilesRemaining}`)
    this.updateTurnState();
  }

  playMove(): void {
    this.turnState.gameState = GameState.InPlay;
    this.players[this.turnState.myOrder].score += this.mvHandlerService.processMove();
    this.tileRack = this.tileBagService.getTiles(this.tileRack);
    this.checkGameOver();
    this.passCounter = 0; //Valid move; reset pass counter -- used to determine if all pass and game is over.
    this.mvSocketService.updateGame(this.createGameDTO());
    this.mvHandlerService.commitMove();
  }

  resetMove():void {
    console.log('GameService:resetMove entered')
    this.currentMove.forEach(sq=>{
      this.dragDropService.insertShiftTileRight(0, sq.letter[0]);
      sq.letter = '';
    });
    this.currentMove = [];
  }

  passMove():void {
    console.log('GameService:passmove entered')
    this.resetMove();
    this.passCounter++;
    this.checkGameOver();
    this.mvSocketService.updateGame(this.createGameDTO());
    this.mvHandlerService.commitMove();
  }

  swapTiles(selected: boolean[]): void{
    this.tileRack = this.tileBagService.swapTiles(this.tileRack, selected);
    this.passMove();
  }

  checkGameOver(): void {
    if ((this.tileBagService.getNumTiles(this.tileRack) === 0 && this.tileBagService.tileBag.length === 0) ||
        (this.passCounter === this.players.length)){
      console.log(`GameService:checkGameOver - Setting Game Over`);
      this.turnState.gameState = GameState.GameOver;
    }
  }

  //Helpers to Update data Subjects for Components

  updateGrid(g?: Square[][]): void {
    (g) && (this.grid = g);
    this.gridSubject.next(this.grid);
  }

  updateTileRack(tr?: Square[]): void {
    (tr) && (this.tileRack = tr);
    this.tileRackSubject.next(this.tileRack);
  }

  updatePlayers(p?: Player[]): void {
    (p) && (this.players = p);
    this.playersSubject.next(this.players);
  }

  updateTurnState(ts?: TurnState): void {
    (ts) && (this.turnState = ts);
    this.turnStateSubject.next(this.turnState);
  }

  private createGameDTO(): GameDTO {
    const gDto = new GameDTO();
    gDto.gameId = this.gameId;
    gDto.gameName = this.game;
    gDto.remainingTiles = this.tileBagService.tileBag.map(o => o.letter);
    gDto.grid = this.grid.map(row => row.map(s => s.letter));
    gDto.turn = this.turnState.turn;
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