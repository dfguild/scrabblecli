import { BehaviorSubject } from 'rxjs';

import { GameDTO, PlayerDTO, GameState } from './Game-dto';
import { Square } from './Square';
import { TileBagService } from './tile-bag.service';
import { MoveSocketService } from './move-socket.service';
import { Player } from './Player';
import { TurnState } from './TurnState';
import { LAST_PLAY_STRING } from '../../Constants';

export class Game {

  mvSocketService: MoveSocketService;
  tileBagService: TileBagService;

  playerName: string = '';
  gameName: string = '';
  id: string = '';

  lastMove: Square[] = []; // to reset color to normal
  preMoveGameDTO: GameDTO = {} as GameDTO;
  passCounter = 0;
  initialLoad = false;

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

  constructor(tileBagSvc: TileBagService, mvSocketSvc: MoveSocketService) {
    this.tileBagService = tileBagSvc;
    this.mvSocketService = mvSocketSvc;
  }

  //Received an update from the Server with a new move (including this players)
  gameDtoEventHandler(gmDTO: GameDTO) {
    console.log(`GameService:gameDtoEventHandler with ${JSON.stringify(gmDTO)}`);
    if (gmDTO.id != this.id) {
      console.log('not an update for current game, ignoring DTO');
    } else if (gmDTO.totalMoves > this.turnState.totalMoves || this.initialLoad) {
      //new or initial move
      this.processGameMoveDTO(gmDTO);
    } else {
      console.log('not a new move, ignoring DTO');
      this.mvSocketService.totalMovesReceived = gmDTO.totalMoves; //tell socket service we got our message
    }
  }

  private processGameMoveDTO(gmDTO: GameDTO) {
    console.log(`GameService:processDTO starting to process DTO`);
    this.preMoveGameDTO = gmDTO;
    let myOrder: number|undefined;
    if (this.initialLoad) {
      this.gameName = gmDTO.gameName;
      myOrder = gmDTO.players.find(pDto => pDto.player_name === this.playerName)?.order;
      if (myOrder === undefined ) throw new Error(`Player: ${this.playerName} not found in server data, exiting...`);
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
    console.log(`GameService:processGameJoins - setting turnState tileBag length to:${this.turnState.tilesRemaining}`);

    this.turnState.turn = gmDTO.turn;
    if (!this.turnState.myTurn) {
      this.updateGrid();
      this.updateTileRack();
    }

    this.updateTurnState();
  }

  public revertMove(): void {
    this.processGameJoins(this.preMoveGameDTO);
  }

  public resetState() {
    this.playerName = '';
    this.gameName = '';
    this.id = '';

    this.lastMove = [];
    this.preMoveGameDTO = {} as GameDTO;
    this.passCounter = 0;
    this.initialLoad = false;
    this.grid.map(r => r.map(s => s.letter=''));
    this.tileRack = [];
    this.turnState = new TurnState();
    this.players=[];
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

  updatePlayers(p?: Player[]): void {
    (p) && (this.players = p);
    this.playersSubject.next(this.players);
  }

  updateTurnState(ts?: TurnState): void {
    (ts) && (this.turnState = ts);
    this.turnStateSubject.next(this.turnState);
  }

  createGameDTO(): GameDTO {
    const gDto = new GameDTO();
    gDto.id = this.id;
    gDto.gameName = this.gameName;
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
    pDto.player_name = this.playerName;
    pDto.tiles = this.tileRack.map(s => s.letter);
    gDto.players.push(pDto);

    if (this.turnState.gameState === GameState.GameOver) {
      //update scores for everyone
      for (const p of this.players) {
        if (p.order === this.turnState.myOrder) continue;
        const newP = new PlayerDTO();
        newP.order = p.order;
        newP.score = p.score;
        gDto.players.push(newP);
      }
    }

    console.log(`GameService:createGameDTO GameDTO=${JSON.stringify(gDto)}`);
    return gDto;
  }

  //helper function to assign tile values to array of letters to create Tile[]
  public assignPointValues(tiles: string[], row: number = 0, scored: boolean = false ): Square[] {
    console.log(`GameService:assignPointValues tiles=${tiles.join()} row=${row}`)
    return tiles.map( (l, i) => {
      const sq = new Square(l, row, i, scored);
      if ( l.search(LAST_PLAY_STRING) != -1) {
        this.lastMove.push(sq);
      }
      return sq;
    });
  }
}
