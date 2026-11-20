import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'explorar',
        loadComponent: () => import('./tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'mi-studio',
        loadComponent: () => import('./tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: '',
        redirectTo: 'explorar',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'tabs/explorar',
    pathMatch: 'full',
  },
];
