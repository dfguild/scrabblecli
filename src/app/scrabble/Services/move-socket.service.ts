import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { GameDTO } from './Game-dto';
import { UserAuthService } from '../../services/user-auth.service';

@Injectable({
  providedIn: 'root'
})
export class MoveSocketService {
  socket = {} as Socket;

  constructor(private readonly authSvc: UserAuthService) {
    this.authSvc.socket$.subscribe(s => this.socket = s);
  }

  startGame(player: string, id: string){
    this.socket.emit('startGame', {player: player, id: id});
  }

  updateGame(gm: GameDTO){
  console.log(`MoveHandlerService:updateGame`);
    this.socket.emit('updateGame', gm);
  }

  getGameDTO(): Observable<GameDTO> {
    return this.socket.fromEvent<GameDTO>('gameDto');
  }

  getGameJoinUpdates(): Observable<GameDTO> {
    return this.socket.fromEvent<GameDTO>('gameJoinUpdate');
  };
}
