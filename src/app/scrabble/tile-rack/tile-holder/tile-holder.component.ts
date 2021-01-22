import { Component, OnInit } from '@angular/core';
import { Square } from '../../services/Square';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropService } from '../../services/drag-drop.service';
import { GameService } from '../../services/game.service';


@Component({
  selector: 'app-tile-holder',
  templateUrl: './tile-holder.component.html',
  styleUrls: ['./tile-holder.component.css']
})
export class TileHolderComponent implements OnInit {

  tiles: Square[] = [];
  swapTilesButtonPressed = false;
  swapTilesSelected: boolean[] = [];

  constructor(
    private readonly ddSvc: DragDropService,
    private readonly gmSvc: GameService,
  ) { }

  dropped(event: CdkDragDrop<string>): void {
    this.ddSvc.tileDrop(event);
  }

  ngOnInit(): void {
    this.gmSvc.tileRack$.subscribe(v => {
      v.map(v=>console.log(`tileRack update letter=${v.letter}`));
      this.tiles = v
    });
  }

  swapTileEventHandler(): void {
    console.log(`TileHolder:swapTileEvent buttonPressed=${this.swapTilesButtonPressed}`)
    if (!this.swapTilesButtonPressed) {
      // set or reset all values to false
      let size = this.tiles.length;
      while(size--) this.swapTilesSelected[size] = false;
    } else if (!this.swapTilesSelected.every(v => v === false)) {
      // valid swap
      console.log(`TileHolder:swapTileEvent ${this.swapTilesSelected.join()}`)
      this.gmSvc.swapTiles(this.swapTilesSelected);
    }
    this.swapTilesButtonPressed = !this.swapTilesButtonPressed;
  }
}
