import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProyectoService } from '../../compartidos/servicios/proyecto.service';
import { AuthService } from '../../compartidos/servicios/auth.service';

interface Proyecto {
    id: number;
    nombre: string;
    descripcion: string | null;
    estado: string;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

    proyectos = signal<Proyecto[]>([]);
    cargando = signal(false);

    constructor(
        private router: Router,
        private proyectoService: ProyectoService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.cargarProyectos();
    }

    cargarProyectos(): void {
        this.cargando.set(true);

        this.proyectoService.listar().subscribe({
            next: (proyectos) => {
                this.proyectos.set(proyectos);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
            }
        });
    }

    seleccionarProyecto(proyecto: Proyecto): void {
        this.router.navigate(['/proyectos', proyecto.id]);
    }

    nuevoProyecto(): void {
        this.router.navigate(['/proyectos/crear']);
    }

    cerrarSesion(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}