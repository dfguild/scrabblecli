import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppMaterialModule } from '../app-material.module';
import { ListGamesComponent } from './list-games/list-games.component';
import { AddGameComponent } from './add-game/add-game.component';
import { ManageGamesComponent } from './manage-games.component';
import { ManageGamesHeaderComponent } from './manage-games-header/manage-games-header.component';

@NgModule({
  declarations: [
    ListGamesComponent,
    AddGameComponent,
    ManageGamesComponent,
    ManageGamesHeaderComponent
  ],
  imports: [
    AppMaterialModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class ManageGamesModule { }
