import { Routes } from '@angular/router';
import { authGuard } from './compartidos/guard/auth.guard';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./paginas/login/login').then(m => m.LoginComponent) },
    {
        path: 'dashboard',
        loadComponent: () => import('./paginas/dashboard/dashboard').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'proyectos/crear',
        loadComponent: () => import('./paginas/proyectos/crear-proyecto/crear-proyecto').then(m => m.CrearProyectoComponent),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];


