import { Component, OnInit, Inject } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { Square } from '../services/Square';
import { DragDropService } from '../services/drag-drop.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent {
  blankLetter: string = 'None';

  constructor(
    private readonly ddSvc: DragDropService,
    readonly gmSvc: GameService,
    public dialog: MatDialog,
  ) { }

  dropped(event: CdkDragDrop<string>): void {
    this.ddSvc.tileDrop(event);
    if (this.ddSvc.blankDropped) {
      const dialogRef = this.dialog.open(ChooseBlankDialog, {
        width: '250px',
        data: {letter: this.blankLetter}
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log(`The chooseBlank dialog was closed with a choice of: ${result}`);
        this.blankLetter = result;
        this.ddSvc.setBlank(this.blankLetter);
      });
    }
  }
}

@Component({
  selector: 'choose-blank-dialog',
  templateUrl: 'choose-blank-dialog.html',
})
export class ChooseBlankDialog {
  constructor(
    public dialogRef: MatDialogRef<ChooseBlankDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {letter: string},
  ) {}

  onCancel(): void {
    this.dialogRef.close()
  }
}
