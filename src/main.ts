import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// 👇 C'EST CETTE LIGNE QUI TE MANQUE (et qui cause l'écran blanc)
import 'zone.js'; 

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));