import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common'; // DatePipe pour afficher la date joliment
import { TacheComponent } from './tache/tache';
import { TodoService, Todo } from './todo';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, TacheComponent], // Ajout de DatePipe
  templateUrl: './app.html',
})


export class App implements OnInit {
  todoService = inject(TodoService);
  user$ = this.todoService.user$;
  
  tachesBrutes = signal<Todo[]>([]);
  chargement = signal(true);

  // 1. ON INITIALISE EN REGARDANT DANS LA MÉMOIRE DU NAVIGATEUR
  // Si 'darkMode' existe et vaut 'true', on met true. Sinon false.
  darkMode = signal(localStorage.getItem('darkMode') === 'true');

  // Idem pour le tri (on force le type pour rassurer TypeScript)
  ordreTri = signal((localStorage.getItem('ordreTri') as 'recent' | 'ancien') || 'recent');

  taches = computed(() => {
     // ... (ton code de tri ne change pas) ...
     const liste = this.tachesBrutes();
     const ordre = this.ordreTri();
     return [...liste].sort((a, b) => {
       const dateA = a.date || 0;
       const dateB = b.date || 0;
       return ordre === 'recent' ? dateB - dateA : dateA - dateB;
     });
  });

  constructor() {
    // 2. EFFET POUR LE DARK MODE
    effect(() => {
      const isDark = this.darkMode();
      
      // A. On sauvegarde le choix pour la prochaine fois
      localStorage.setItem('darkMode', String(isDark));

      // B. On applique la classe CSS (pour Tailwind v4)
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    // 3. EFFET POUR LE TRI
    effect(() => {
      // On sauvegarde juste la préférence
      localStorage.setItem('ordreTri', this.ordreTri());
    });
  }

  ngOnInit() {
    this.todoService.getTodos().subscribe(data => {
      this.tachesBrutes.set(data);
      this.chargement.set(false); // On arrête le chargement quand les données arrivent
    });
  }

  // Fonctions d'actions
  basculerTri() {
    this.ordreTri.update(o => o === 'recent' ? 'ancien' : 'recent');
  }

  basculerDarkMode() {
    this.darkMode.update(v => !v);
  }

  login() { this.todoService.login(); }
  logout() { 
    this.todoService.logout(); 
    this.tachesBrutes.set([]); // On vide la liste locale en sortant
  }
  
  ajouterTache(nom: string) {
    if (!nom.trim()) return;
    this.todoService.addDoc(nom);
  }

  supprimerTache(tache: Todo) { this.todoService.deleteTodo(tache.id); }
  basculerTache(todo: Todo) { this.todoService.updateTodo(todo); }
}