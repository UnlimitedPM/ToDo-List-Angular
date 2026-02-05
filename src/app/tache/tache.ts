import { Component, input, output } from '@angular/core';
import { Todo } from '../todo'; // <--- Note l'import depuis '../todo'

@Component({
  selector: 'app-tache',
  imports: [],
  templateUrl: './tache.html',
})
export class TacheComponent {
  // On reçoit l'objet entier (Obligatoire)
  tache = input.required<Todo>();

  // Les événements vers le parent
  supprimer = output<void>();
  toggle = output<void>();

  onSupprimer() {
    this.supprimer.emit();
  }

  onToggle() {
    this.toggle.emit();
  }
}