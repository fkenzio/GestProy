import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-crear-proyecto',
    imports: [FormsModule],
    templateUrl: './crear-proyecto.html',
    styleUrl: './crear-proyecto.css'
})
export class CrearProyectoComponent {
    //por ahora solo es un formulario para crear proyectos, luego se conectara a la base de datos
    nombre = signal('');
    descripcion = signal('');
    prioridad = signal('media');
    fechaInicio = signal('');
    fechaFin = signal('');
    cargando = signal(false);
    error = signal('');

    constructor(private router: Router) { }

    guardar(): void {
        this.error.set('');

        if (!this.nombre()) {
            this.error.set('El nombre del proyecto es obligatorio');
            return;
        }

        this.cargando.set(true);

        setTimeout(() => {
            this.cargando.set(false);
        }, 500);
    }

    cancelar(): void {
        this.router.navigate(['/dashboard']);
    }
}