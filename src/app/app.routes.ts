import { Routes } from '@angular/router';
import { authGuard } from './compartidos/guard/auth.guard';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./paginas/login/login').then(m => m.LoginComponent) },
    { path: 'registro', loadComponent: () => import('./paginas/registro/registro').then(m => m.RegistroComponent) },
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
    {
        path: 'proyectos/:id',
        loadComponent: () => import('./paginas/proyectos/detalle-proyecto/detalle-proyecto').then(m => m.DetalleProyectoComponent),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];


