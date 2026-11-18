import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Shell } from './core/layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'tracks',
        loadComponent: () => import('./features/tracks/track-list/track-list').then((m) => m.TrackList),
      },
      {
        path: 'tracks/:id',
        loadComponent: () =>
          import('./features/tracks/track-detail/track-detail').then((m) => m.TrackDetail),
      },
      {
        path: 'artists',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/artists/artist-list/artist-list').then((m) => m.ArtistList),
      },
      { path: '', pathMatch: 'full', redirectTo: 'tracks' },
    ],
  },
  { path: '**', redirectTo: '' },
];
