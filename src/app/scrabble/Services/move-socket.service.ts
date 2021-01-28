import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { GameDTO } from './Game-dto';
import { SocketService } from '../../services/socket.service';
import { DTO_POLL_TIME, DTO_RETRIES, DTO_RETRY_INTERVAL } from '../../Constants';

@Injectable({
  providedIn: 'root'
})
export class MoveSocketService {
  socket = {} as Socket;
  socketReady$!: Observable<boolean>;
  totalMovesReceived = 0;

  constructor(
    private readonly socketSvc: SocketService
    ) {
    this.socketSvc.socket$.subscribe(s => this.socket = s);
    this.socketReady$ = socketSvc.socketReady$;
  }

  startGame(player: string, id: string){
    this.socketSvc.waitForSocket().then(_ => {
      console.log('MoveSocketSvc:startGame sending:', player, id);
      this.socket.emit('startGame', {player: player, id: id});
      });
  }

  async updateGame(gm: GameDTO): Promise<boolean> {
    console.log(`MoveHandlerService:updateGame`);
    this.dtoRequest(gm);
    return await this.confirmDTO(gm);
  }

  getGameDTO(): Observable<GameDTO> {
    return this.socket.fromEvent<GameDTO>('gameDto');
  }

  getGameJoinUpdates(): Observable<GameDTO> {
    return this.socket.fromEvent<GameDTO>('gameJoinUpdate');
  }

  private async confirmDTO(gm: GameDTO): Promise<boolean> {
    let dto_polls = 0;
    while (dto_polls++ <= (DTO_RETRIES * (DTO_RETRY_INTERVAL + 1) - 1)) {  // math added to continue to poll after the last interval
      await this.sleep(DTO_POLL_TIME);
      if (this.totalMovesReceived === gm.totalMoves) {
        console.log(`MoveSocketSvc:confirmDTO poll:${dto_polls} got correct dto`);
        return true;
      } else {
        console.log(`MoveSocketSvc:confirmDTO poll:${dto_polls} did NOT get correct dto`);
        if (dto_polls % DTO_RETRY_INTERVAL === 0) {
          console.log(`MoveSocketSvc:confirmDTO sending dto request again...`);
          this.dtoRequest(gm);
        }
      }
    }
    return false;
  }

  private dtoRequest(gm: GameDTO) {
    this.socketSvc.waitForSocket().then(_ => {
        console.log('MoveSocketSvc:dtoRequest sending:', gm);
        this.socket.emit('updateGame', gm);
      });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
