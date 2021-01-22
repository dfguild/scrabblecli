import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject } from 'rxjs';
import { UserAuthService } from './user-auth.service';
import { AuthSocket } from './auth-socket';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket_: Socket = {} as Socket;
  private socketSubject = new BehaviorSubject<Socket>(this.socket_);
  public socket$ = this.socketSubject.asObservable();
  private socketReadySubject = new BehaviorSubject<boolean>(false);
  public socketReady$ = this.socketReadySubject.asObservable();

  private socketReady_ = false;

  constructor(
    private userAuth: UserAuthService,
  ) {
    console.log(`SocketService:constructor Calling setup socket`);
    this.setUpSocket();
  }

  async setUpSocket() {
    await this.waitFor_(() => this.userAuth.authToken !== '');
    this.socket = new AuthSocket(this.userAuth.authToken);
    console.log(`SocketSvc:setUpSocket got socket=${this.socket}`);

    //handlers for socket issues
    this.socket_.on('disconnect', (reason: string) => {
        console.log(`socket disconnected with reason: ${reason}`);
        this.socketReady = false;
    });
    this.socket_.on('reconnect', (num: number) => {
        console.log(`SocketService:reconnect on ${num}th try`);
        this.socketReady = true;
    });

    this.socketReady = true;
  }

  private set socketReady(state: boolean) {
    this.socketReady_ = state;
    this.socketReadySubject.next(this.socketReady_);
  }

  private set socket(s: Socket) {
    this.socket_ = s;
    this.socketSubject.next(this.socket_);
  }

  public async waitForSocket(): Promise<void> {
    await this.waitFor_(() =>
      ((this.userAuth?.authToken !== '') && (this.socketReady_))
    );
  }

  private async waitFor_(cmpFn: ()=>boolean): Promise<void> {
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
