import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TacheComponent } from './tache/tache';
import { TodoService, Todo } from './todo';

@Component({
  selector: 'app-root',
  imports: [TacheComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  title = signal('Ma To-Do List Firebase 🔥');
  
  private todoService = inject(TodoService);
  taches = signal<Todo[]>([]);

  ngOnInit() {
    this.todoService.getTodos().subscribe(data => {
      // AJOUTE CE LOG
      console.log('Données reçues de Firebase :', data); 
      
      this.taches.set(data);
    });
  }

  ajouterTache(nom: string) {
    if (!nom.trim()) return;
    // Note : la méthode s'appelle addDoc ou addTodo selon ce que tu as mis dans le service
    this.todoService.addDoc(nom); 
    // Pas besoin de subscribe ni de update local, la magie du ngOnInit fait le travail !
  }

  supprimerTache(tache: Todo) {
    this.todoService.deleteTodo(tache.id);
  }

  basculerTache(todo: Todo) {
    this.todoService.updateTodo(todo);
  }
}