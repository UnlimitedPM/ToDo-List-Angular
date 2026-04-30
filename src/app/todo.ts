import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot } from '@angular/fire/firestore';
// Imports pour l'Auth
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Observable, switchMap, of } from 'rxjs';

export interface Todo {
  id: string;
  nom: string;
  estTerminee: boolean;
  date?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Observable qui contient l'utilisateur connecté (ou null s'il n'y a personne)
  user$ = user(this.auth);

  // 1. LOGIN (Connexion avec Google)
  login() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  // 2. LOGOUT
  logout() {
    return signOut(this.auth);
  }

  // 3. GET (Intelligent)
  // Cette fonction attend automatiquement qu'on soit connecté pour charger la bonne liste
  getTodos(): Observable<Todo[]> {
    return this.user$.pipe(
      switchMap(currentUser => {
        // Si personne n'est connecté, on renvoie une liste vide
        if (!currentUser) {
          return of([]); 
        }

        // Sinon, on vise la collection PRIVÉE de l'utilisateur : users/SON_ID/todos
        const userTodoCollection = collection(this.firestore, 'users', currentUser.uid, 'todos');

        // Et on lance l'écoute (le code que tu avais déjà)
        return new Observable<Todo[]>((observer) => {
          const unsubscribe = onSnapshot(userTodoCollection, (snapshot) => {
            const resultats = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Todo));
            observer.next(resultats);
          }, error => observer.error(error));
          return () => unsubscribe();
        });
      })
    );
  }

  // Pour Ajouter/Supprimer/Modifier, on a besoin de l'ID de l'utilisateur
  // Donc on crée une petite fonction privée pour récupérer l'ID actuel
  private get userId() {
    return this.auth.currentUser?.uid;
  }

  addDoc(nom: string) {
    if (!this.userId) return;
    const userTodoCollection = collection(this.firestore, 'users', this.userId, 'todos');
    
    return addDoc(userTodoCollection, { 
      nom, 
      estTerminee: false,
      date: Date.now() // <--- On ajoute le timestamp actuel
    });
  }

  deleteTodo(id: string) {
    if (!this.userId) return;
    const docRef = doc(this.firestore, 'users', this.userId, 'todos', id);
    return deleteDoc(docRef);
  }

  // src/app/todo.ts (Ligne 89 environ)
  updateTodo(id: string, modifications: Partial<Todo>) {
    if (!this.userId) return;
    const docRef = doc(this.firestore, 'users', this.userId, 'todos', id);
    return updateDoc(docRef, modifications);
  }
}