import * as Constants from '../../Constants';

export class SquareClasses {
  tile = false;
  square = true;
  scored = false;
  lastMove = false;
  tw = false;
  dw = false;
  tl = false;
  dl = false;
  itemdraggable = true;

  setTile():void {
    this.tile=true;
    this.square = this.tw = this.dw = this.tl = this.dl = false;
  }

  setSquare(sv: Constants.SquareValue):void {
    this.square=true;
    this.tile = this.tw = this.dw = this.tl = this.dl = false;
    switch (sv) {
      case Constants.SquareValue.DW: {
        this.dw = true;
        break;
      }
      case Constants.SquareValue.TW: {
        this.tw = true;
        break;
      }
      case Constants.SquareValue.DL: {
        this.dl = true;
        break;
      }
      case Constants.SquareValue.TL: {
        this.tl = true;
        break;
      }
      default: {
        break;
      }
    }
  }
}

export class Square {
  private _letter: string = '';
  private _letterValue: number = 0;
  private _row: number = 0;
  private _col: number = 0;
  private _mainText = '';
  private _isTile = false;
  private _isBlank = false;
  private _squareValue: Constants.SquareValue = Constants.SquareValue.NONE;
  private _isScored = false;
  public sqClasses = new SquareClasses();

  constructor(letter: string, row: number, col: number, scored: boolean = false){
    if ( letter == null ) {letter = ''};
    this._row = row;
    this._col = col;
    this._setSquareValue();
    this.letter = letter;
    (this.isTile) && (this.isScored = scored);
  }

  set letter(l: string) {
    this._letter = l;
    if (l === '') {
      this._isTile = false;
      this._letter = '';
      this._letterValue = 0;
      this._setMainText();
      this.sqClasses.setSquare(this._squareValue);
    }else{
      this._setLetterValue(l);
    }
  }

  set isScored(b: boolean) {
    this._isScored = b;
    this.sqClasses.scored = b;
  }

  get isScored(): boolean {
    return this._isScored;
  }

  get letter(): string {return this._letter;}

  get letterValue(): number {return this._letterValue;}

  get row(): number {return this._row}

  get col(): number {return this._col}

  get isBlank(): boolean {return this._isBlank}

  setBlank(l: string): void {
    this.letter = '?' + l;
  }

  get squareValue(): { letterMultiplier: number, wordMultiplier: number} {
    let letterMultiple = 1;
    let wordMultiple =1;
    switch(this._squareValue) {
      case Constants.SquareValue.TW:
        wordMultiple=3;
        break
      case Constants.SquareValue.DW:
        wordMultiple=2;
        break
      case Constants.SquareValue.TL:
        letterMultiple=3;
        break
      case Constants.SquareValue.DL:
        letterMultiple=2;
        break
    }
    return { letterMultiplier: letterMultiple, wordMultiplier: wordMultiple };
  }

  get isTile(): boolean {return this._isTile}

  get mainText(): string {return this._mainText}

  private _setSquareValue(): void {
    this._squareValue = Constants.squareValues.get(`${this.row},${this.col}`) || Constants.SquareValue.NONE;
    this.sqClasses.setSquare(this._squareValue);
    this._setMainText();
  }

  private _setLetterValue(l: string): void {
    l = l.toUpperCase();
    this._letter = l;
    this._isBlank = (this._letter[0] === '?');
    this._letterValue = Constants.bonus_letter_tiles.get(this._letter[0]) || 0;
    this._isTile = true;
    this._setMainText();
    this.sqClasses.setTile();
  }

  private _setMainText():void {
    if (this._isTile) {
      if ( this._letter[0] === '?' ) {
        this._mainText = (this._letter.length === 1) ? this._letter[0] : this._letter[1];
      } else {
        this._mainText = this._letter[0];
      }
      return;
    }

    this._mainText = '';
    switch (this._squareValue) {
      case Constants.SquareValue.DW: {
        this._mainText = 'DW';
        break;
      }
      case Constants.SquareValue.TW: {
        this._mainText = 'TW';
        break;
      }
      case Constants.SquareValue.DL: {
        this._mainText = 'DL';
        break;
      }
      case Constants.SquareValue.TL: {
        this._mainText = 'TL';
        break;
      }
    }
  }
}
