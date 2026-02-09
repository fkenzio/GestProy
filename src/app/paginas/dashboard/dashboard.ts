import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';

//esto no se va a quedar aqui, es solo para no crear archivos de mas por ahora...
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
export class DashboardComponent {

    proyectos = signal<Proyecto[]>([]);
    cargando = signal(false);

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.cargarProyectos();
    }

    cargarProyectos(): void {
        this.cargando.set(true);
        //para simular proyectos
        setTimeout(() => {
            this.proyectos.set([
                { id: 1, nombre: 'Proyecto 1', descripcion: 'Descripcion 1', estado: 'Activo' },
                { id: 2, nombre: 'Proyecto 2', descripcion: 'Descripcion 2', estado: 'Inactivo' },
                { id: 3, nombre: 'Proyecto 3', descripcion: 'Descripcion 3', estado: 'Activo' },
            ]);
            this.cargando.set(false);
        }, 500);
    }

    //para cuando se de click en el proyecto
    seleccionarProyecto(proyecto: Proyecto): void {
        this.router.navigate(['/proyectos', proyecto.id]);
    }

    nuevoProyecto(): void {
        this.router.navigate(['/proyectos/crear']);
    }

    cerrarSesion(): void {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
    }
}