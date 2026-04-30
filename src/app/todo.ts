import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, addDoc, doc, deleteDoc, 
  updateDoc, onSnapshot, query, where, writeBatch, orderBy, getDocs 
} from '@angular/fire/firestore'; // Ajout de getDocs
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Observable, switchMap, of } from 'rxjs';

export type TypeReset = 'standard' | 'daily' | 'weekly' | 'custom';

export interface ListeTodo {
  id: string;
  nom: string;
  type: TypeReset;
  joursReset?: number[];
  dernierReset?: number;
  estParDefaut: boolean;
  ordre: number;
}

export interface Todo {
  id: string;
  nom: string;
  estTerminee: boolean;
  estPrioritaire?: boolean; // 👈 Nouveau champ
  date?: number;
  listeId: string;
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  user$ = user(this.auth);

  private get userId() {
    return this.auth.currentUser?.uid;
  }

  login() { return signInWithPopup(this.auth, new GoogleAuthProvider()); }
  logout() { return signOut(this.auth); }

  // --- GESTION DES LISTES ---
  
  getListes(): Observable<ListeTodo[]> {
    return this.user$.pipe(
      switchMap(currentUser => {
        if (!currentUser) return of([]);
        const colRef = collection(this.firestore, 'users', currentUser.uid, 'listes');
        const q = query(colRef, orderBy('ordre', 'asc')); 
        
        return new Observable<ListeTodo[]>((observer) => {
          return onSnapshot(q, (snapshot) => {
            const listes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ListeTodo));
            if (listes.length === 0) {
              this.initialiserListesParDefaut(currentUser.uid);
            }
            observer.next(listes);
          });
        });
      })
    );
  }

  private async initialiserListesParDefaut(uid: string) {
    const colRefListes = collection(this.firestore, 'users', uid, 'listes');
    const colRefTodos = collection(this.firestore, 'users', uid, 'todos');

    // 1. On crée d'abord "Ma To-Do" et on récupère son ID généré
    const docMaTodo = await addDoc(colRefListes, { 
      nom: 'Ma To-Do', 
      type: 'standard', 
      estParDefaut: true, 
      ordre: 1 
    });
    const maTodoId = docMaTodo.id;

    // 2. On crée les autres listes par défaut
    const autres = [
      { nom: 'Daily', type: 'daily', estParDefaut: true, ordre: 2 },
      { nom: 'Weekly', type: 'weekly', joursReset: [1], estParDefaut: true, ordre: 3 },
      { nom: 'Custom Reset', type: 'custom', joursReset: [2, 4], estParDefaut: true, ordre: 4 }
    ];
    for (const l of autres) { await addDoc(colRefListes, l); }

    // 3. LOGIQUE DE MIGRATION
    // On récupère TOUTES les tâches existantes pour voir si elles sont orphelines
    const snapshotTodos = await getDocs(colRefTodos);
    const batch = writeBatch(this.firestore);
    let migrationFaite = false;

    snapshotTodos.docs.forEach(tacheDoc => {
      const data = tacheDoc.data();
      // Si la tâche n'a pas de listeId, c'est une ancienne donnée !
      if (!data['listeId']) {
        batch.update(tacheDoc.ref, { listeId: maTodoId });
        migrationFaite = true;
      }
    });

    if (migrationFaite) {
      await batch.commit();
      console.log("Migration des anciennes tâches vers 'Ma To-Do' réussie !");
    }
  }

  async addListe(nom: string, type: TypeReset, ordre: number, jours?: number[]) {
    if (!this.userId) return;
    const colRef = collection(this.firestore, 'users', this.userId, 'listes');
    return addDoc(colRef, { nom, type, joursReset: jours || [], estParDefaut: false, ordre });
  }

  async deleteListe(id: string) {
    if (!this.userId) return;
    const docRef = doc(this.firestore, 'users', this.userId, 'listes', id);
    return deleteDoc(docRef);
  }

  async updateListe(id: string, modifications: Partial<ListeTodo>) {
    if (!this.userId) return;
    const docRef = doc(this.firestore, 'users', this.userId, 'listes', id);
    return updateDoc(docRef, modifications);
  }

  // --- GESTION DES TÂCHES ---

  getTodosParListe(listeId: string): Observable<Todo[]> {
    return this.user$.pipe(
      switchMap(currentUser => {
        if (!currentUser || !listeId) return of([]);
        const colRef = collection(this.firestore, 'users', currentUser.uid, 'todos');
        const q = query(colRef, where('listeId', '==', listeId));
        return new Observable<Todo[]>((observer) => {
          return onSnapshot(q, (snapshot) => {
            observer.next(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo)));
          });
        });
      })
    );
  }

  async verifierEtReset(liste: ListeTodo, taches: Todo[], dateRef: Date = new Date()) {
    if (!this.userId || taches.length === 0) return;

    // On utilise dateRef au lieu de new Date() partout
    const aujourdhuiMinuit = new Date(dateRef.getFullYear(), dateRef.getMonth(), dateRef.getDate()).getTime();
    const dernierReset = liste.dernierReset || 0;

    let doitReset = false;

    // Logique de calcul avec le jour de la semaine de dateRef
    if (liste.type === 'daily' && dernierReset < aujourdhuiMinuit) {
      doitReset = true;
    } else if (liste.type === 'weekly' && dateRef.getDay() === liste.joursReset?.[0] && dernierReset < aujourdhuiMinuit) {
      doitReset = true;
    } else if (liste.type === 'custom' && liste.joursReset?.includes(dateRef.getDay()) && dernierReset < aujourdhuiMinuit) {
      doitReset = true;
    }

    if (doitReset) {
      const batch = writeBatch(this.firestore);
      taches.filter(t => t.estTerminee).forEach(t => {
        const tRef = doc(this.firestore, 'users', this.userId!, 'todos', t.id);
        batch.update(tRef, { estTerminee: false });
      });

      const lRef = doc(this.firestore, 'users', this.userId, 'listes', liste.id);
      batch.update(lRef, { dernierReset: aujourdhuiMinuit });

      await batch.commit();
      console.log(`🚀 Reset simulé réussi pour le jour : ${dateRef.toLocaleDateString()}`);
    }
  }

  addDoc(nom: string, listeId: string) {
    if (!this.userId) return;
    const colRef = collection(this.firestore, 'users', this.userId, 'todos');
    return addDoc(colRef, { nom, estTerminee: false, date: Date.now(), listeId });
  }

  deleteTodo(id: string) {
    if (!this.userId) return;
    const docRef = doc(this.firestore, 'users', this.userId, 'todos', id);
    return deleteDoc(docRef);
  }

  updateTodo(id: string, modifications: Partial<Todo>) {
    if (!this.userId) return;
    const docRef = doc(this.firestore, 'users', this.userId, 'todos', id);
    return updateDoc(docRef, modifications);
  }
}