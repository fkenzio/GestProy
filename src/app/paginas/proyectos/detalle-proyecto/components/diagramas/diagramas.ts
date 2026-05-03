import { Component, input, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Proyecto, Diagrama } from '../../models';
import { DiagramaService } from '../../../../../compartidos/servicios/diagrama.service';

@Component({
    selector: 'app-diagramas',
    standalone: true,
    imports: [FormsModule, DatePipe],
    templateUrl: './diagramas.html',
    styleUrl: './diagramas.css'
})
export class DiagramasComponent {

    proyecto = input.required<Proyecto>();

    diagramas = signal<Diagrama[]>([]);
    mostrarModal = signal(false);
    nombreDiagrama = signal('');
    tipoDiagrama = signal('clases');
    error = signal('');

    tiposDisponibles = [
        { clave: 'clases', etiqueta: 'Diagrama de Clases', icono: '&#9633;' }
    ];

    constructor(
        private diagramaService: DiagramaService,
        private router: Router
    ) {
        effect(() => {
            const p = this.proyecto();
            if (p) this.cargarDiagramas();
        });
    }

    cargarDiagramas(): void {
        this.diagramaService.listarPorProyecto(this.proyecto().id).subscribe({
            next: (data) => this.diagramas.set(data)
        });
    }

    abrirModal(): void {
        this.nombreDiagrama.set('');
        this.tipoDiagrama.set('clases');
        this.error.set('');
        this.mostrarModal.set(true);
    }

    cerrarModal(): void {
        this.mostrarModal.set(false);
    }

    crearDiagrama(): void {
        this.error.set('');
        const nombre = this.nombreDiagrama();
        if (!nombre.trim()) {
            this.error.set('El nombre es obligatorio');
            return;
        }

        this.diagramaService.crear({
            proyecto_id: this.proyecto().id,
            nombre: nombre,
            tipo: this.tipoDiagrama(),
            datos: { elements: [], connections: [] }
        }).subscribe({
            next: (res) => {
                this.mostrarModal.set(false);
                this.router.navigate(['/proyectos', this.proyecto().id, 'diagrama', res.diagrama.id]);
            },
            error: (err) => this.error.set(err.error?.error || 'Error al crear el diagrama')
        });
    }

    abrirEditor(diagrama: Diagrama): void {
        this.router.navigate(['/proyectos', this.proyecto().id, 'diagrama', diagrama.id]);
    }

    eliminarDiagrama(diagrama: Diagrama, event: Event): void {
        event.stopPropagation();
        this.diagramaService.eliminar(diagrama.id).subscribe({
            next: () => this.diagramas.set(this.diagramas().filter(d => d.id !== diagrama.id))
        });
    }

    obtenerEtiquetaTipo(tipo: string): string {
        const t = this.tiposDisponibles.find(td => td.clave === tipo);
        return t ? t.etiqueta : tipo;
    }
}
