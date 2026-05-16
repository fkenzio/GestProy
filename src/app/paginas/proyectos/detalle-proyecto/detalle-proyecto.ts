import { Component, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Proyecto } from './models';
import { ResumenComponent } from './components/resumen/resumen';
import { MiembrosComponent } from './components/miembros/miembros';
import { StakeholdersComponent } from './components/stakeholders/stakeholders';
import { ProcesosComponent } from './components/procesos/procesos';
import { DiagramasComponent } from './components/diagramas/diagramas';
import { ProyectoService } from '../../../compartidos/servicios/proyecto.service';
import { SpecsService } from '../../../compartidos/servicios/specs.service';
import { generarSpecsZIP } from '../../../compartidos/utils/specs-generator';

@Component({
    selector: 'app-detalle-proyecto',
    standalone: true,
    imports: [ResumenComponent, MiembrosComponent, StakeholdersComponent, ProcesosComponent, DiagramasComponent],
    templateUrl: './detalle-proyecto.html',
    styleUrl: './detalle-proyecto.css'
})
export class DetalleProyectoComponent {

    proyecto = signal<Proyecto | null>(null);
    pestanaActiva = signal('resumen');
    cargando = signal(false);
    generandoSpecs = signal(false);

    pestanas = [
        { clave: 'resumen', etiqueta: 'Resumen' },
        { clave: 'miembros', etiqueta: 'Miembros / Roles' },
        { clave: 'stakeholders', etiqueta: 'Stakeholders' },
        { clave: 'procesos', etiqueta: 'Procesos y Subprocesos' },
        { clave: 'diagramas', etiqueta: 'Diagramas' }
    ];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private proyectoService: ProyectoService,
        private specsService: SpecsService
    ) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.cargarProyecto(id);
    }

    cargarProyecto(id: number): void {
        this.cargando.set(true);

        this.proyectoService.obtener(id).subscribe({
            next: (proyecto) => {
                this.proyecto.set(proyecto);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.router.navigate(['/dashboard']);
            }
        });
    }

    cambiarPestana(clave: string): void {
        this.pestanaActiva.set(clave);
    }

    regresar(): void {
        this.router.navigate(['/dashboard']);
    }

    generarSpecs(): void {
        const p = this.proyecto();
        if (!p) return;
        this.generandoSpecs.set(true);
        this.specsService.recopilarDatos(p.id).subscribe({
            next: async (data) => {
                await generarSpecsZIP(data);
                this.generandoSpecs.set(false);
            },
            error: () => {
                this.generandoSpecs.set(false);
                alert('Error al generar las especificaciones');
            }
        });
    }
}