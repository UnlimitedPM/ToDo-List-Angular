import { Component, input, output } from '@angular/core';
import { Todo } from '../todo';
// 👇 1. IMPORT OBLIGATOIRE
import { DatePipe } from '@angular/common'; 

@Component({
  selector: 'app-tache',
  // 👇 2. AJOUTE-LE ICI
  imports: [DatePipe], 
  templateUrl: './tache.html',
})
export class TacheComponent {
  tache = input.required<Todo>();
  supprimer = output<void>();
  toggle = output<void>();

  onSupprimer() { this.supprimer.emit(); }
  onToggle() { this.toggle.emit(); }
}