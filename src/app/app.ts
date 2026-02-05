import { Component, inject, signal, OnInit } from '@angular/core';
// On importe AsyncPipe pour gérer l'utilisateur dans le HTML facilement
import { AsyncPipe } from '@angular/common'; 
import { TacheComponent } from './tache/tache';
import { TodoService, Todo } from './todo';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, TacheComponent], // Ajoute AsyncPipe ici
  templateUrl: './app.html',
})
export class App implements OnInit {
  // On rend le service public pour y accéder depuis le HTML (pour le login/logout)
  todoService = inject(TodoService);
  
  // On récupère l'observable de l'utilisateur directement
  user$ = this.todoService.user$;

  taches = signal<Todo[]>([]);

  ngOnInit() {
    // Le getTodos est maintenant intelligent, il changera tout seul quand on se connecte
    this.todoService.getTodos().subscribe(data => {
      this.taches.set(data);
    });
  }

  login() { this.todoService.login(); }
  logout() { this.todoService.logout(); }
  
  // Le reste ne change pas (ajoute, supprime, etc.)
  ajouterTache(nom: string) {
    if (!nom.trim()) return;
    this.todoService.addDoc(nom);
  }

  supprimerTache(tache: Todo) {
    this.todoService.deleteTodo(tache.id);
  }

  basculerTache(todo: Todo) {
    this.todoService.updateTodo(todo);
  }
}