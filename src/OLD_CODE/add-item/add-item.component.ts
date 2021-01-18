import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

class ItemForm {
  constructor( public name: string = '' ) {}
}

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.css']
})
export class AddItemComponent{

  model = new ItemForm();
  submitted = false;
  playerName = '';
  @Input() type = '';
  @Output() submitEvent = new EventEmitter<string>();

  constructor() {}

  onSubmit(): any {
    this.submitEvent.emit(this.model.name);
  }
}
