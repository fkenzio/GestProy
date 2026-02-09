import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-registro',
    imports: [FormsModule],
    templateUrl: './registro.html',
    styleUrl: './registro.css'
})
export class RegistroComponent {

    nombre = signal('');
    apellido = signal('');
    correo = signal('');
    contrasena = signal('');
    confirmarContrasena = signal('');
    cargando = signal(false);
    error = signal('');

    constructor(private router: Router) { }

    registrar(): void {
        this.error.set('');

        if (!this.nombre() || !this.apellido() || !this.correo() || !this.contrasena()) {
            this.error.set('Todos los campos son obligatorios');
            return;
        }

        if (this.contrasena() !== this.confirmarContrasena()) {
            this.error.set('Las contrasenas no coinciden');
            return;
        }

        this.cargando.set(true);

        setTimeout(() => {
            this.cargando.set(false);
            this.router.navigate(['/login']);
        }, 500);
    }

    irALogin(): void {
        this.router.navigate(['/login']);
    }
}