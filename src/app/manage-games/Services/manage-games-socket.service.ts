import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

import GameCreateInDto from './Game-create-in.dto';
import { GameListDTO } from './Game-List.dto';
import { UserAuthService } from '../../services/user-auth.service';
import { AuthSocket } from '../../services/auth-socket';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class ManageGamesSocketService {
  public player: string = '';
  public gameId: number = 0;
  private socket: Socket = {} as Socket;

  private socketReady = new BehaviorSubject(false);
  public socketReady$ = this.socketReady.asObservable();

  private isSocketReady = () => {
    return ((this.userAuth.authToken !== '') && (this.socket !== {} as Socket));
  }

  constructor(
    private userAuth: UserAuthService,
  ) {
    console.log(`ManageGamesSocketSvc:constructor Calling setup socket`);
    this.setUpSocket();
  }

  async setUpSocket() {
    this.userAuth.playerName$.subscribe(pName => this.player = pName);
    await this.waitFor(() => this.userAuth.authToken !== '');
    this.socket = new AuthSocket(this.userAuth.authToken);
    this.userAuth.socket = this.socket;
    console.log(`ManageGamesSocketSvc:setUpSocket exiting socket=${this.socket}`);
    this.socketReady.next(true);
  }

  createGame(gameName: string): void {
    const g = new GameCreateInDto;
    g.gameName = gameName;
    g.playerName = this.player;
    this.waitFor(this.isSocketReady).then(_ => {
    console.log('ManageGamesSocketService:createGame sending:', g);
    this.socket.emit('createGame', g);
    });
  }

  joinGame(gameId: number): void {
    const g = new GameCreateInDto;
    g.gameId = gameId;
    g.playerName = this.player;
    this.waitFor(this.isSocketReady).then(_ => {
      console.log('ManageGamesSocketService:joinGame sending:', g);
      this.socket.emit('joinGame', g)
      });
  }

  async getGames(): Promise<void> {
    this.waitFor(this.isSocketReady).then(_ => {
      console.log(`ManageGamesSocketService:getGames -- socket returned - sending event 'getGames'`);
      this.socket.emit('getGames');
      });
  }

  getGames$(): Observable<GameListDTO> {
    console.log(`ManageGamesSocketService:getGames$`);
    return this.socket.fromEvent('gameListUpdates');
  }

  private async waitFor(cmpFn: ()=>boolean): Promise<void> {
    const poll = (resolve: () => void) => {
      if(cmpFn()) {
        console.log(`ManageGamesSocket:waitForToken token ready`);
        resolve();
      } else {
        console.log(`ManageGamesSocket:waitForToken token not ready waiting`);
        setTimeout(_ => poll(resolve), 400);
      }
    }

    return new Promise(poll);
  }
}
