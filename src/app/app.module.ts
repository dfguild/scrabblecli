import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SocketIoModule } from 'ngx-socket-io';
import { AuthModule, AuthGuard } from '@auth0/auth0-angular';

import { AppComponent } from './app.component';
import { AppMaterialModule } from './app-material.module';
import { SharedComponentsModule } from './components/shared-components.module';
import { ManageGamesModule } from './manage-games/manage-games.module'
import { ManageGamesComponent } from './manage-games/manage-games.component';
import { environment } from 'src/environments/environment';
import { ScrabbleModule } from './scrabble/scrabble.module';
import { ScrabbleComponent } from './scrabble/scrabble.component';

const routes: Routes = [{path: 'manageGames', component: ManageGamesComponent, canActivate: [AuthGuard]},
                        {path: 'scrabble', component: ScrabbleComponent, canActivate: [AuthGuard]},
                        {path: '', redirectTo: '/manageGames', pathMatch: 'full'},
                        {path: '**', redirectTo: '/manageGames', pathMatch: 'full'},
                      ];

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    AppMaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    FlexLayoutModule,
    ManageGamesModule,
    ScrabbleModule,
    SharedComponentsModule,
    SocketIoModule,
    AuthModule.forRoot({...environment.auth}),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
