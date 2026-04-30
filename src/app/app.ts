import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { AsyncPipe } from '@angular/common'; 
import { TacheComponent } from './tache/tache';
import { TodoService, Todo } from './todo';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, TacheComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  todoService = inject(TodoService);
  user$ = this.todoService.user$;
  
  tachesBrutes = signal<Todo[]>([]);
  chargement = signal(true);
  darkMode = signal(localStorage.getItem('darkMode') === 'true');
  ordreTri = signal((localStorage.getItem('ordreTri') as 'recent' | 'ancien') || 'recent');

  taches = computed(() => {
     const liste = this.tachesBrutes();
     const ordre = this.ordreTri();
     return [...liste].sort((a, b) => {
       const dateA = a.date || 0;
       const dateB = b.date || 0;
       return ordre === 'recent' ? dateB - dateA : dateA - dateB;
     });
  });

  // 👇 LA NOUVELLE FONCTION BIEN PLACÉE ICI
  gererEntree(event: any, textarea: HTMLTextAreaElement) {
    if (!event.shiftKey) {
      event.preventDefault(); 
      this.ajouterTache(textarea.value);
      textarea.value = '';
      textarea.style.height = 'auto';
    }
  }

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      localStorage.setItem('darkMode', String(isDark));
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    effect(() => {
      localStorage.setItem('ordreTri', this.ordreTri());
    });
  }

  ngOnInit() {
    this.todoService.getTodos().subscribe(data => {
      this.tachesBrutes.set(data);
      this.chargement.set(false);
    });
  }

  basculerTri() { this.ordreTri.update(o => o === 'recent' ? 'ancien' : 'recent'); }
  basculerDarkMode() { this.darkMode.update(v => !v); }
  login() { this.todoService.login(); }
  logout() { 
    this.todoService.logout(); 
    this.tachesBrutes.set([]); 
  }
  
  ajouterTache(nom: string) {
    if (!nom.trim()) return;
    this.todoService.addDoc(nom);
  }

  supprimerTache(tache: Todo) { this.todoService.deleteTodo(tache.id); }

  // Ajoute cette fonction dans ta classe App
  modifierTache(tache: Todo, nouveauNom: string) {
  this.todoService.updateTodo(tache.id, { nom: nouveauNom });
  }

  // Et modifie basculerTache pour utiliser la nouvelle signature du service
  basculerTache(todo: Todo) { 
    this.todoService.updateTodo(todo.id, { estTerminee: !todo.estTerminee }); 
  }
}