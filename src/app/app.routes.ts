import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [MsalGuard],
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  },

  {
    path: 'catalog',
    canActivate: [MsalGuard],
    loadComponent: () => import('./catalog/catalog').then(m => m.Catalog)
  },

  {
    path: 'orders',
    canActivate: [MsalGuard],
    loadComponent: () => import('./orders/orders').then(m => m.Orders)
  }
];
