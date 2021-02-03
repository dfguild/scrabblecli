import { Injectable } from '@angular/core';
import { Square } from './Square';

@Injectable({
  providedIn: 'root'
})
export class TileBagService {

  tileBag: Square[] = [];

  constructor() { }

  resetTileBag() {
    this.tileBag = [];
  }

  getTiles(tileRack: Square[]): Square[] {
    let numTile = Math.min(7 - this.getNumTiles(tileRack), this.tileBag.length);
    console.log(`TileBag:getTiles - getting ${numTile} tiles`)
    let nextBlankIndex = tileRack.findIndex(s => !s.isTile);
    while(numTile-- > 0){
      const randomIndex = Math.floor(Math.random() * this.tileBag.length);
      tileRack[nextBlankIndex].letter = this.tileBag[ randomIndex ].letter;
      console.log(`In while put ${tileRack[nextBlankIndex].letter} at index ${nextBlankIndex}`)
      this.tileBag.splice(randomIndex, 1);
      console.log(`tilebag is now ${this.tileBag.length} long`)
      nextBlankIndex = tileRack.findIndex(s => !s.isTile);
    }

    return tileRack;
  }

  public getNumTiles(tileRack: Square[]): number {
    let count = 0;
    for (let i = 0; i < tileRack.length; i++) {
      if (tileRack[i].isTile) {
        count++;
      }
    }
    return count;
  }

  swapTiles(tileRack: Square[], swapTiles: boolean[]): Square[] {
    let savedLetters: string[] = [];
    for (let i = 0; i<swapTiles.length; i++) {
      if (swapTiles[i]) {
        savedLetters.push(tileRack[i].letter);
        tileRack[i].letter = '';
      }
    }
    tileRack = this.getTiles(tileRack);
    this.tileBag = [...this.tileBag, ...savedLetters.map((v) => new Square(v, 0, this.tileBag.length))];
    return tileRack;
  }
}
