import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BoardComponent, ChooseBlankDialog } from './board/board.component';
import { ScoresComponent } from './scores/scores.component';
import { TileHolderComponent } from './tile-rack/tile-holder/tile-holder.component';
import { ScrabbleComponent } from './scrabble.component';
import { AppMaterialModule } from '../app-material.module';
import { TileRackComponent } from './tile-rack/tile-rack.component';
import { SharedComponentsModule } from '../components/shared-components.module';

@NgModule({
  declarations: [ BoardComponent,
                  ChooseBlankDialog,
                  ScoresComponent,
                  TileHolderComponent,
                  ScrabbleComponent,
                  TileRackComponent,
                ],
  imports: [
    AppMaterialModule,
    CommonModule,
    SharedComponentsModule,
  ],
  entryComponents: [
    ChooseBlankDialog,
  ]
})
export class ScrabbleModule { }
