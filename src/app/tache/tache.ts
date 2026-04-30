import { Component, input, output, signal, ViewChild, ElementRef } from '@angular/core'; // Ajout de ViewChild et ElementRef
import { Todo } from '../todo';
import { DatePipe } from '@angular/common'; 

@Component({
  selector: 'app-tache',
  imports: [DatePipe], 
  templateUrl: './tache.html',
})
export class TacheComponent {
  tache = input.required<Todo>();
  supprimer = output<void>();
  toggle = output<void>();
  modifier = output<string>();

  estEnEdition = signal(false);

  // 👇 CETTE FONCTION S'EXÉCUTE DÈS QUE LE TEXTAREA APPARAÎT
  @ViewChild('inputEdit') set inputRef(element: ElementRef<HTMLTextAreaElement>) {
    if (element) {
      const el = element.nativeElement;
      el.focus(); // 1. On met le focus automatiquement
      // 2. On ajuste la hauteur immédiatement selon le contenu
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }

  activerEdition() {
    if (!this.tache().estTerminee) {
      this.estEnEdition.set(true);
    }
  }

  validerEdition(nouveauNom: string) {
    // On ne valide que si le nom a vraiment changé et n'est pas vide
    if (nouveauNom.trim() && nouveauNom !== this.tache().nom) {
      this.modifier.emit(nouveauNom);
    }
    this.estEnEdition.set(false);
  }

  gererTouche(event: any, textarea: HTMLTextAreaElement) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.validerEdition(textarea.value);
    }
  }

  onSupprimer() { this.supprimer.emit(); }
  onToggle() { this.toggle.emit(); }
}