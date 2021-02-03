import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';

import GameCreateInDto from './Game-create-in.dto';
import { GameListDTO } from './Game-List.dto';
import { UserAuthService } from '../../services/user-auth.service';
import { SocketService } from '../../services/socket.service';

@Injectable({
  providedIn: 'root'
})
export class ManageGamesSocketService {
  public player: string = '';
  public id: string = '';
  private socket: Socket = {} as Socket;
  public socketReady$!: Observable<boolean>;

  constructor(
    private userAuth: UserAuthService,
    private socketSvc: SocketService,
  ) {
    console.log(`ManageGamesSocketSvc:constructor Calling setup socket`);
    this.setUpSocket();
    this.socketReady$ = this.socketSvc.socketReady$;

    // Set up connect callback to rejoin room upon connect/reconnect
    this.socketSvc.waitForSocket().then(_ => {
      this.socket.on('connect', () => {
        console.log('ManageGamesSocketSvc:Connect Callback fired');
        if (this.id) {
          console.log('calling getGames');
          this.getGames();
        }
      });
    });
  }

  async setUpSocket() {
    this.userAuth.playerName$.subscribe(pName => this.player = pName);
    this.socketSvc.socket$.subscribe(s => this.socket = s);
    await this.socketSvc.waitForSocket();
    console.log(`ManageGamesSocketSvc:setUpSocket exiting socket=${this.socket}`);
  }

  onExit() {
    console.log('ManageGamesSocketSvc:onExit');
    this.socket.removeListener('connect');
  }

  createGame(gameName: string): void {
    const g = new GameCreateInDto;
    g.gameName = gameName;
    g.playerName = this.player;
    this.socketSvc.waitForSocket().then(_ => {
    console.log('ManageGamesSocketService:createGame sending:', g);
    this.socket.emit('createGame', g);
    });
  }

  joinGame(id: string): void {
    const g = new GameCreateInDto;
    g.id = id;
    g.playerName = this.player;
    this.socketSvc.waitForSocket().then(_ => {
      console.log('ManageGamesSocketService:joinGame sending:', g);
      this.socket.emit('joinGame', g)
      });
  }

  async getGames(): Promise<void> {
    this.socketSvc.waitForSocket().then(_ => {
      console.log(`ManageGamesSocketService:getGames -- socket returned - sending event 'getGames'`);
      this.socket.emit('getGames');
      });
  }

  getGames$(): Observable<GameListDTO> {
    console.log(`ManageGamesSocketService:getGames$`);
    return this.socket.fromEvent('gameListUpdates');
  }
}
