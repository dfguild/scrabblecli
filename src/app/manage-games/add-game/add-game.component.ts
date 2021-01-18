import { Component, OnInit } from '@angular/core';
import { ManageGamesSocketService } from '../Services/manage-games-socket.service';

@Component({
  selector: 'app-add-game',
  templateUrl: './add-game.component.html',
  styleUrls: ['./add-game.component.css']
})
export class AddGameComponent implements OnInit {
  addGameButtonPressed = false;

  constructor(private readonly signonSvc: ManageGamesSocketService) { }

  ngOnInit(): void {
  }

  addGame(gameName: string): void {
    console.log(`addGame:addGame adding:${gameName}`);
    (gameName) && this.signonSvc.createGame(gameName);
    this.addGameButtonPressed = !this.addGameButtonPressed;
  }
}
