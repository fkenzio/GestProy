import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../compartidos/servicios/auth.service';

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

    constructor(private router: Router, private authService: AuthService) { }

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

        this.authService.registro({
            nombre: this.nombre(),
            apellido: this.apellido(),
            correo: this.correo(),
            contrasena: this.contrasena()
        }).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.error.set(err.error?.error || 'Error al registrar');
                this.cargando.set(false);
            }
        });
    }

    irALogin(): void {
        this.router.navigate(['/login']);
    }
}