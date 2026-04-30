import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { TacheComponent } from './tache/tache';
import { TodoService, Todo, ListeTodo, TypeReset } from './todo';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, TacheComponent, FormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  todoService = inject(TodoService);
  user$ = this.todoService.user$;
  
  listes = signal<ListeTodo[]>([]);
  listeActiveId = signal<string | null>(null);
  listeActive = computed(() => this.listes().find(l => l.id === this.listeActiveId()) || null);

  tachesBrutes = signal<Todo[]>([]);
  chargement = signal(true);
  darkMode = signal(localStorage.getItem('darkMode') === 'true');
  ordreTri = signal((localStorage.getItem('ordreTri') as 'recent' | 'ancien') || 'recent');

  showModal = signal(false);
  modeEditionListe = signal(false);
  nouveauNomListe = signal('');
  nouveauTypeListe = signal<TypeReset>('standard');
  joursSelectionnes = signal<number[]>([]);
  
  joursSemaine = [
    { id: 1, nom: 'Lun' }, { id: 2, nom: 'Mar' }, { id: 3, nom: 'Mer' },
    { id: 4, nom: 'Jeu' }, { id: 5, nom: 'Ven' }, { id: 6, nom: 'Sam' }, { id: 0, nom: 'Dim' }
  ];

  formulaireListeValide = computed(() => {
    const nomOk = this.nouveauNomListe().trim().length > 0;
    const type = this.nouveauTypeListe();
    if (type === 'weekly' || type === 'custom') {
      return nomOk && this.joursSelectionnes().length > 0;
    }
    return nomOk;
  });

  taches = computed(() => {
    const liste = this.tachesBrutes();
    const ordre = this.ordreTri();
    
    return [...liste].sort((a, b) => {
      const prioriteA = a.estPrioritaire ? 1 : 0;
      const prioriteB = b.estPrioritaire ? 1 : 0;
      
      if (prioriteA !== prioriteB) return prioriteB - prioriteA;

      const dateA = a.date || 0;
      const dateB = b.date || 0;
      return ordre === 'recent' ? dateB - dateA : dateA - dateB;
    });
  });

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      localStorage.setItem('darkMode', String(isDark));
      document.documentElement.classList.toggle('dark', isDark);
    });
    effect(() => localStorage.setItem('ordreTri', this.ordreTri()));
  }

  ngOnInit() {
    this.todoService.getListes().subscribe(listes => {
      this.listes.set(listes);
      if (!this.listeActiveId() && listes.length > 0) this.changerListe(listes[0].id);
    });
  }

  changerListe(id: string) {
    this.listeActiveId.set(id);
    this.chargement.set(true);
    this.todoService.getTodosParListe(id).subscribe(taches => {
      this.tachesBrutes.set(taches);
      this.chargement.set(false);
      const liste = this.listeActive();
      if (liste) this.todoService.verifierEtReset(liste, taches);
    });
  }

  ouvrirModalNouvelleListe() {
    this.modeEditionListe.set(false);
    this.nouveauNomListe.set('');
    this.nouveauTypeListe.set('standard');
    this.joursSelectionnes.set([]);
    this.showModal.set(true);
  }

  ouvrirModalEditionListe() {
    const liste = this.listeActive();
    if (!liste) return;
    this.modeEditionListe.set(true);
    this.nouveauNomListe.set(liste.nom);
    this.nouveauTypeListe.set(liste.type);
    this.joursSelectionnes.set(liste.joursReset || []);
    this.showModal.set(true);
  }

  async validerActionListe() {
    if (!this.formulaireListeValide()) return;
    if (this.modeEditionListe()) {
      const liste = this.listeActive();
      if (liste) {
        await this.todoService.updateListe(liste.id, {
          nom: this.nouveauNomListe(),
          joursReset: this.joursSelectionnes()
        });
      }
    } else {
      const nouvelOrdre = this.listes().length + 1;
      const docRef = await this.todoService.addListe(this.nouveauNomListe(), this.nouveauTypeListe(), nouvelOrdre, this.joursSelectionnes());
      if (docRef) this.changerListe(docRef.id);
    }
    this.showModal.set(false);
  }

  toggleJour(id: number) {
    if (this.nouveauTypeListe() === 'weekly') {
      this.joursSelectionnes.set([id]);
    } else {
      const actuels = this.joursSelectionnes();
      this.joursSelectionnes.set(actuels.includes(id) ? actuels.filter(j => j !== id) : [...actuels, id]);
    }
  }

  async supprimerListeActive() {
    const liste = this.listeActive();
    if (liste && !liste.estParDefaut && confirm(`Supprimer "${liste.nom}" ?`)) {
      await this.todoService.deleteListe(liste.id);
      const principale = this.listes().find(l => l.estParDefaut && l.ordre === 1);
      if (principale) this.changerListe(principale.id);
    }
  }

  gererEntree(event: any, textarea: HTMLTextAreaElement) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.ajouterTache(textarea.value);
      textarea.value = '';
      textarea.style.height = 'auto';
    }
  }

  ajouterTache(nom: string) {
    const lId = this.listeActiveId();
    if (nom.trim() && lId) this.todoService.addDoc(nom, lId);
  }

  modifierTache(tache: Todo, nouveauNom: string) { this.todoService.updateTodo(tache.id, { nom: nouveauNom }); }
  
  basculerPriorite(tache: Todo) {
    this.todoService.updateTodo(tache.id, { estPrioritaire: !tache.estPrioritaire });
  }

  basculerTache(todo: Todo) { this.todoService.updateTodo(todo.id, { estTerminee: !todo.estTerminee }); }
  supprimerTache(tache: Todo) { this.todoService.deleteTodo(tache.id); }
  basculerTri() { this.ordreTri.update(o => o === 'recent' ? 'ancien' : 'recent'); }
  basculerDarkMode() { this.darkMode.update(v => !v); }
  login() { this.todoService.login(); }
  logout() { 
    this.todoService.logout(); 
    this.tachesBrutes.set([]);
    this.listeActiveId.set(null);
  }
}