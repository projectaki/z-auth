import { Route } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { MainPageComponent } from './main-page.component';

export const routes: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'jwt',
        loadComponent: () => import('./jwt-page/jwt-page.component').then(m => m.JwtPageComponent),
      },
      {
        path: 'date',
        loadComponent: () => import('./date-page/date-page.component').then(m => m.DatePageComponent),
      },
      {
        path: '**',
        redirectTo: 'jwt',
      },
    ],
  },
];
