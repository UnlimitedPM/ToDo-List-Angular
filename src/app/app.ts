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

  // 1. SIGNAL POUR LES DONNÉES BRUTES
  tachesBrutes = signal<Todo[]>([]);

  // 2. SIGNAL POUR L'ÉTAT DE CHARGEMENT
  chargement = signal(true); // Vrai par défaut

  // 3. SIGNAL POUR L'ORDRE DE TRI ('recent' ou 'ancien')
  ordreTri = signal<'recent' | 'ancien'>('recent');

  // 4. SIGNAL POUR LE DARK MODE
  darkMode = signal(false);

  // 5. SIGNAL CALCULÉ (COMPUTED) : La liste triée
  taches = computed(() => {
    // On prend la liste brute
    const liste = this.tachesBrutes();
    const ordre = this.ordreTri();

    // On la trie (on crée une copie avec [...liste] pour ne pas toucher l'originale)
    return [...liste].sort((a, b) => {
      const dateA = a.date || 0; // Si pas de date, on met 0 (très vieux)
      const dateB = b.date || 0;
      return ordre === 'recent' ? dateB - dateA : dateA - dateB;
    });
  });

  constructor() {
    // Un "effect" pour gérer le Dark Mode sur le <body>
    effect(() => {
      if (this.darkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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