import { Component, input, output, signal, ViewChild, ElementRef } from '@angular/core';
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
  priorite = output<void>(); // 👈 Le canal d'émission

  estEnEdition = signal(false);
  private clickTimer: any = null;

  @ViewChild('inputEdit') set inputRef(element: ElementRef<HTMLTextAreaElement>) {
    if (element) {
      const el = element.nativeElement;
      el.focus();
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }

  gererClick() {
    if (this.clickTimer) return;
    this.clickTimer = setTimeout(() => {
      this.onToggle();
      this.clickTimer = null;
    }, 175); // 🕒 Ton réglage favori
  }

  gererDblClick() {
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }
    this.activerEdition();
  }

  activerEdition() {
    if (this.tache().estTerminee) return;
    this.estEnEdition.set(true);
  }

  validerEdition(nouveauNom: string) {
    if (nouveauNom.trim() && nouveauNom !== this.tache().nom) this.modifier.emit(nouveauNom);
    this.estEnEdition.set(false);
  }

  gererTouche(event: any, textarea: HTMLTextAreaElement) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.validerEdition(textarea.value);
    }
  }

  onPriorite() { this.priorite.emit(); } // 🌟 On envoie le signal
  onSupprimer() { this.supprimer.emit(); }
  onToggle() { this.toggle.emit(); }
}