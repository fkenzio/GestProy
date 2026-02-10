import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProyectoService } from '../../../compartidos/servicios/proyecto.service';

@Component({
    selector: 'app-crear-proyecto',
    imports: [FormsModule],
    templateUrl: './crear-proyecto.html',
    styleUrl: './crear-proyecto.css'
})
export class CrearProyectoComponent {

    nombre = signal('');
    descripcion = signal('');
    prioridad = signal('media');
    fechaInicio = signal('');
    fechaFin = signal('');
    cargando = signal(false);
    error = signal('');

    constructor(private router: Router, private proyectoService: ProyectoService) { }

    guardar(): void {
        this.error.set('');

        if (!this.nombre()) {
            this.error.set('El nombre del proyecto es obligatorio');
            return;
        }

        this.cargando.set(true);

        this.proyectoService.crear({
            nombre: this.nombre(),
            descripcion: this.descripcion() || null,
            prioridad: this.prioridad(),
            fecha_inicio: this.fechaInicio() || null,
            fecha_fin: this.fechaFin() || null
        }).subscribe({
            next: (res) => {
                this.router.navigate(['/proyectos', res.proyecto.id]);
            },
            error: (err) => {
                this.error.set(err.error?.error || 'Error al crear proyecto');
                this.cargando.set(false);
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/dashboard']);
    }
}