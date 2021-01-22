import { Injectable, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { take } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  public profileJson: string = '';


  public ready = false;
  public isAuthenticated$: Observable<boolean>

  public authToken: string = '';

  private playerName_: string = ''
  private playerNameSubject = new BehaviorSubject<string>('');
  public playerName$ = this.playerNameSubject.asObservable();

  constructor(
    private readonly auth: AuthService,
  ){
    this.isAuthenticated$ = this.auth.isAuthenticated$;
    this.getAuthInformation();
  }

  async getAuthInformation(): Promise<void> {
    console.log('In UserAuthService ngOnInit')

    const profile = await this.auth.user$.pipe(take(1)).toPromise<any>();
    this.profileJson = JSON.stringify(profile, null, 2);
    this.playerName_ = profile.nickname;
    this.playerNameSubject.next(this.playerName_);
    console.log('UserAuthService profileJson=',this.profileJson);
    console.log('UserAuthService playerName=',this.playerName_);

    this.authToken = await this.auth.getAccessTokenSilently().pipe(take(1)).toPromise();
    console.log(`UserAuthService access token is: ${this.authToken}`);
    this.ready = true;
  }
}
