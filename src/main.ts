import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import { camera, images, add, trash } from 'ionicons/icons';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { appConfig } from './app/app.config';
import { App } from './app/app';

addIcons({ camera, images, add, trash });

defineCustomElements(window);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
