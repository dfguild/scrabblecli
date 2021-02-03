import { Injectable } from '@angular/core';
import { Game } from './Game';
import { Square } from './Square';
import WordList from '../../../assets/words_dictionary.json';

enum DIR {
  H,
  V
}

const H_PRIOR = [0,-1];
const H_AFTER = [0,1];
const V_PRIOR = [-1,0];
const V_AFTER = [1,0];

interface Word {
  text: string;
  squares: Square[];
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class MoveHandlerService {

  mvDir: DIR = DIR.H;
  words: Word[] = [];
  gm!: Game;
  currentMove: Square[] = [];
  mvStart!: Square;
  mvEnd!: Square;
  validWords: string[] = [];

  constructor() {}

  setGameObject(gm: Game): void {
    this.gm = gm;
  }

  resetMoveState(resetMove = true) {
    this.words = [];
    resetMove && (this.currentMove = []);
    this.validWords = [];
  }

  commitMove(): void{
    for ( let s of this.currentMove ) {
      s.isScored = true;
    }
    this.resetMoveState();
  }

  processTileDrop(): number {
    if ( this.currentMove.length === 0 ) return 0; // handle pass
    this.processBoard();
    return this.totalScore();
  }

  playMove(): number {
    if ( this.currentMove.length === 0 ) return 0; // handle pass
    this.processBoard();
    this.checkWords();

    console.log(`MoveHandler:playMove - found words: ${this.words.join()}`);
    return this.totalScore();
  }

  private processBoard(): void {
    this.resetMoveState(false);
    if (this.gm.turnState.turn === 0 && !this.gm.grid[7][7].isTile) {
      throw new Error('Invalid First Move: Must play using center square');
    }
    this.setMoveDirection();
    this.sortMove();
    this.isMoveContiguous();
    this.findWords();
  }

  private totalScore(): number {
    return (this.words.length > 0) ? this.words.map(o=>o.score).reduce((a, b) => a+b) : 0;
  }

  private setMoveDirection(): void {
    if (this.currentMove.length === 1) {
      this.mvDir = DIR.H;
    } else if (this.currentMove[0].row === this.currentMove[1].row) {
      this.mvDir = DIR.H
      if(!this.currentMove.every(s => s.row === this.currentMove[0].row)) {
        this.currentMove.map(s => console.log(`Thinks invalid Horiz move with ${s.letter} ${s.row} ${s.col}`))
        throw new Error('Invalid Move: Tiles must be in a line')
      };
    } else if ( this.currentMove[0].col === this.currentMove[1].col) {
      this.mvDir = DIR.V;
      if(!this.currentMove.every(s => s.col === this.currentMove[0].col)) {
        throw new Error('Invalid Move: Tiles must be in a line')
      };
    } else {
      throw new Error('Invalid Move: Tiles must be in a line');
    }
  }

  private isMoveContiguous(): void {
    const moveSize = this.currentMove.length;
    if ( moveSize === 1) return;
    if (this.mvDir === DIR.H) {
      for (let i = this.mvStart.col; i <= this.mvEnd.col; i++) {
        if (! this.gm.grid[this.mvStart.row][i].isTile) throw new Error('Non-contiguous Move');
      }
    } else {
      for (let i = this.mvStart.row; i <= this.mvEnd.row; i++) {
        if (! this.gm.grid[i][this.mvStart.col].isTile) throw new Error('Non-contiguous Move');
      }
    }
  }

  private sortMove(): void {
    if (this.currentMove.length != 1) {
      if (this.mvDir === DIR.H) {
        this.currentMove.sort((a,b) => a.col - b.col);
      } else {
        this.currentMove.sort((a,b) => a.row - b.row);
      }
    }
    this.mvStart = this.currentMove[0];
    this.mvEnd = this.currentMove[this.currentMove.length - 1];
  }

  findWords() {
    let word = this.findWord(this.mvStart, this.mvDir);
    if (word) this.words.push(word);

    let dir = this.mvDir == DIR.H ? DIR.V : DIR.H; //look crosswise
    for (let s of this.currentMove) {
      word = this.findWord(s, dir);
      if (word) this.words.push(word);
    }
  }

  findWord(s: Square, dir: DIR): Word | undefined {

    let start = this.findStart(s, dir);
    let end = this.findEnd(s, dir);

    //One letter word -- return nothing
    if (start == end) {
      return undefined;
    }
    return this.getWord(start, end);
  }

  private findStart(s: Square, dir: DIR ): Square {
    let row = s.row; let col = s.col;
    let priorRow: number; let priorCol: number;
    do {
      priorRow = row;
      priorCol = col;
      row += dir === DIR.H ? H_PRIOR[0] : V_PRIOR[0];
      col += dir === DIR.H ? H_PRIOR[1] : V_PRIOR[1];
    } while ( (row >= 0) && (col >=0) && this.gm.grid[row][col].isTile );
    return this.gm.grid[priorRow][priorCol];
  }

  private scoreWord(word: Word): Word {
    let wordBonusMultiplier = 1;

    for ( let s of word.squares ) {
      let sqScore = s.letterValue;
      if (!s.isScored) {
        const multiplier = s.squareValue;
        wordBonusMultiplier *= multiplier.wordMultiplier;
        sqScore *= multiplier.letterMultiplier;
      }
      console.log(`MoveHandler:scoreWord - adding ${sqScore} to ${word.score}`)
      word.score += sqScore;
    }
    console.log(`MoveHandler:scoreWord - multiplying ${word.score} by ${wordBonusMultiplier}`)
    word.score *= wordBonusMultiplier;
    word.score += (this.currentMove.length === 7) ? 50 : 0;
    return word;
  }

  private findEnd(s: Square, dir: DIR ): Square {
    let row = s.row; let col = s.col;
    let priorRow: number; let priorCol: number;
    do {
      priorRow = row;
      priorCol = col;
      row += dir === DIR.H ? H_AFTER[0] : V_AFTER[0];
      col += dir === DIR.H ? H_AFTER[1] : V_AFTER[1];
    } while ( (row <= 14) && (col <= 14) && this.gm.grid[row][col].isTile );
    return this.gm.grid[priorRow][priorCol];
  }

  private getWord(start: Square, end: Square): Word {
    let word: Word = {text: '', squares: [], score: 0};
    if ( start.row === end.row ) {
      //Horizontal word
      for ( let s of this.gm.grid[start.row].slice(start.col, end.col+1)) {
        word.squares.push(s);
        word.text += s.mainText;
      }
    } else {
      //vertical word
      for (let i = start.row; i <= end.row; i++) {
        word.squares.push(this.gm.grid[i][start.col]);
        word.text += this.gm.grid[i][start.col].mainText;
      }
    }
    return this.scoreWord(word);
  }

  checkWords(): void {
    let invalidWords: string[] = [];
    if (this.words.length === 0) { throw new Error('No valid words played')};
    for ( let w of this.words) {
      console.log(`MoveHandler:checkWords - checking: ${w.text}`)
      if (!WordList.hasOwnProperty(w.text.toUpperCase())) {
        console.log(`MoveHandler:checkWords - ${w.text} invalid`)
        invalidWords.push(w.text);
      }
    }
    if (invalidWords.length >= 1) {throw new Error(`Invalid Words: ${invalidWords.join()}`)}
  }
}
