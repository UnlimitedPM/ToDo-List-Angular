import { Injectable, inject } from '@angular/core';
// On importe 'onSnapshot' qui est la méthode native de bas niveau
import { Firestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Todo {
  id: string;
  nom: string;
  estTerminee: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private firestore = inject(Firestore);
  private todoCollection = collection(this.firestore, 'todos'); 

  // 1. GET (Version Manuelle / Native)
  // On construit notre propre Observable pour contourner le bug de type
  getTodos(): Observable<Todo[]> {
    return new Observable((observer) => {
      // onSnapshot écoute la base en temps réel
      const unsubscribe = onSnapshot(this.todoCollection, (snapshot) => {
        // On transforme les résultats manuellement
        const resultats = snapshot.docs.map(doc => {
          return {
            id: doc.id,         // On récupère l'ID
            ...doc.data()       // On récupère le reste (nom, estTerminee)
          } as Todo;
        });
        
        // On envoie les données à Angular
        observer.next(resultats);
      }, (error) => {
        // En cas d'erreur, on prévient Angular
        observer.error(error);
      });

      // Fonction de nettoyage quand on quitte la page
      return () => unsubscribe();
    });
  }

  // 2. ADD (Pas de changement)
  addDoc(nom: string) {
    const nouvelleTache = { nom: nom, estTerminee: false };
    return addDoc(this.todoCollection, nouvelleTache);
  }

  // 3. DELETE (Pas de changement)
  deleteTodo(id: string) {
    const docRef = doc(this.firestore, 'todos/' + id);
    return deleteDoc(docRef);
  }

  // 4. UPDATE (Pas de changement)
  updateTodo(todo: Todo) {
    const docRef = doc(this.firestore, 'todos/' + todo.id);
    return updateDoc(docRef, { estTerminee: !todo.estTerminee });
  }
}