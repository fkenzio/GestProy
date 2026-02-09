import { Component, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface Proyecto {
    id: number;
    nombre: string;
    descripcion: string | null;
    estado: string;
}

@Component({
    selector: 'app-detalle-proyecto',
    templateUrl: './detalle-proyecto.html',
    styleUrl: './detalle-proyecto.css'
})
export class DetalleProyectoComponent {

    proyecto = signal<Proyecto | null>(null);
    pestanaActiva = signal('resumen');
    cargando = signal(false);

    pestanas = [
        { clave: 'resumen', etiqueta: 'Resumen' },
        { clave: 'miembros', etiqueta: 'Miembros / Roles' },
        { clave: 'stakeholders', etiqueta: 'Stakeholders' },
        { clave: 'procesos', etiqueta: 'Procesos y Subprocesos' }
    ];

    constructor(private router: Router, private route: ActivatedRoute) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.cargarProyecto(id);
    }

    cargarProyecto(id: number): void {
        this.cargando.set(true);

        setTimeout(() => {
            this.proyecto.set({
                id: id,
                nombre: 'Colio enterprises',
                descripcion: 'Control de entradas y salidas de almacen',
                estado: 'en_progreso'
            });
            this.cargando.set(false);
        }, 300);
    }

    cambiarPestana(clave: string): void {
        this.pestanaActiva.set(clave);
    }

    regresar(): void {
        this.router.navigate(['/dashboard']);
    }
}