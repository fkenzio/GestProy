import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../compartidos/servicios/auth.service';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginComponent {

    correo = signal('');
    password = signal('');
    cargando = signal(false);
    error = signal('');

    constructor(private router: Router, private authService: AuthService) { }

    iniciarSesion(): void {
        this.error.set('');

        if (!this.correo() || !this.password()) {
            this.error.set('Ingresa correo y contrasena');
            return;
        }

        this.cargando.set(true);

        this.authService.login(this.correo(), this.password()).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.error.set(err.error?.error || 'Error al iniciar sesion');
                this.cargando.set(false);
            }
        });
    }

    irARegistro(): void {
        this.router.navigate(['/registro']);
    }
}