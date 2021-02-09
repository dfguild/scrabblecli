import { Injectable } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Game } from './Game';
import { Square } from './Square';
import { MoveHandlerService } from './move-handler.service';

@Injectable({
  providedIn: 'root'
})
export class DragDropService {

  gm!: Game;
  blankDropped: Square | null = null;

  constructor(private readonly mvSvc: MoveHandlerService) {}

  setGameObject(gm: Game): void {
    this.gm = gm;
  }

  tileDrop(event: CdkDragDrop<string>): void {
    this.blankDropped = null;
    let fromSource: string = event.previousContainer.data.substring(0,2);
    let fromRow, fromCol = 0;
    [fromRow, fromCol] = event.previousContainer.data.substring(2).split(',',2).map(s => Number(s));
    let toSource: string = event.container.data.substring(0,2);
    let toRow, toCol = 0;
    [toRow, toCol] = event.container.data.substring(2).split(',',2).map(s => Number(s));

    if (fromSource === 'TR' && toSource === 'TR') {
      //drag/drop within rack
      const letter = this.gm.tileRack[fromCol].letter;
      this.gm.tileRack[fromCol].letter='';
      if (fromCol < toCol) {
        this.insertShiftTileLeft(toCol, letter);
      } else {
        this.insertShiftTileRight(toCol, letter);
      }

    } else if ( fromSource === 'TR' && toSource === 'BD'){
      if (!this.gm.turnState.myTurn) return;
      //drag/drop from rack to board
      if (this.gm.grid[toRow][toCol].isTile) return;  //already a tile there
      this.gm.grid[toRow][toCol].letter = this.gm.tileRack[fromCol].letter;
      this.blankDropped = this.gm.grid[toRow][toCol].isBlank ? this.gm.grid[toRow][toCol] : null;
      this.gm.tileRack[fromCol].letter = '';
      this.gm.updateTileRack();
      this.gm.updateGrid();
      this.mvSvc.currentMove.push(this.gm.grid[toRow][toCol]);
      this.createMessage();

    } else if ( fromSource === "BD" && toSource === 'BD'){
      if (!this.gm.turnState.myTurn) return;
      if (this.gm.grid[toRow][toCol].isTile) return; //should not happen - should not be a drop area
      this.gm.grid[toRow][toCol].letter = this.gm.grid[fromRow][fromCol].letter;
      this.blankDropped = this.gm.grid[toRow][toCol].isBlank ? this.gm.grid[toRow][toCol] : null;
      this.gm.grid[fromRow][fromCol].letter = '';
      this.gm.updateGrid();
      this.mvSvc.currentMove.push(this.gm.grid[toRow][toCol]);
      this.mvSvc.currentMove = this.removeTile(this.mvSvc.currentMove, fromRow, fromCol);
      this.createMessage();

    } else if ( fromSource === "BD" && toSource === 'TR') {
      let letter = this.gm.grid[fromRow][fromCol].letter[0]; // reset to blank if ? + Letter
      this.gm.grid[fromRow][fromCol].letter = '';
      if (!this.insertShiftTileRight(toCol, letter)) {
        this.insertShiftTileLeft(toCol, letter);
      }
      this.gm.updateTileRack();
      this.gm.updateGrid();
      this.mvSvc.currentMove = this.removeTile(this.mvSvc.currentMove, fromRow, fromCol);
      this.createMessage();
    }
    this.mvSvc.currentMove.map(s=>console.log(`sq: ${s.letter}-${s.row}-${s.col} `));
  }

  public insertShiftTileRight(toCol: number, letter: string): boolean {
    if (!this.gm.tileRack[toCol].isTile) {
      this.gm.tileRack[toCol].letter = letter;
      return true;
    } else {
      let sqRight = this.gm.tileRack.slice(toCol+1).findIndex(e => !e.isTile);
      if (sqRight != -1) {
        sqRight = sqRight + toCol + 1;
        while (sqRight > toCol) {
        this.gm.tileRack[sqRight].letter = this.gm.tileRack[sqRight-1].letter;
        sqRight--;
        }
        this.gm.tileRack[toCol].letter = letter;
        return true;
      } else {
        return false;
      }
    }
  }

  public insertShiftTileLeft(toCol: number, letter: string): boolean {
    if (!this.gm.tileRack[toCol].isTile) {
      this.gm.tileRack[toCol].letter = letter;
      return true;
    }
    let l = this.gm.tileRack[toCol].letter;
    this.gm.tileRack[toCol].letter = letter;
    while (this.gm.tileRack[--toCol].isTile) {
      const tileVal = this.gm.tileRack[toCol].letter;
      this.gm.tileRack[toCol].letter = l;
      l = tileVal;
    }
    this.gm.tileRack[toCol].letter = l;
    return true;
  }

  setBlank(l: string) {
    if (this.blankDropped) {
      this.blankDropped.setBlank(l);
    }
  }

  createMessage() {
    try {
      const score = this.mvSvc.processTileDrop();
      if (score) {
        this.gm.turnState.gameMessage = `${score} points`;
      } else {
        this.gm.turnState.gameMessage = '';
      }
    } catch(e) {
      if (e instanceof Error) {
        this.gm.turnState.gameMessage = e.message;
      } else {
        throw(e);
      }
    }
    this.gm.updateTurnState();
  }

  private removeTile(arr: Square[], row: number, col: number): Square[] {
    const index = arr.findIndex(o=>(o.row === row && o.col=== col));
    index != -1 && arr.splice(index, 1);
    return arr;
  }
}
