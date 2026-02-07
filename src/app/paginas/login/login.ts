import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

    constructor(private router: Router) { }

    iniciarSesion(): void {
        this.error.set('');

        if (!this.correo() || !this.password()) {
            this.error.set('Ingresa correo y contraseña');
            return;
        }

        this.cargando.set(true);
        //simular login por ahora
        setTimeout(() => {
            //por ahora la unica validacion para el correo es la @
            if (this.correo().includes('@')) {
                localStorage.setItem('token', 'token-temporal');
                this.router.navigate(['/dashboard']);
            } else {
                this.error.set('Correo o contraseña incorrectos');
            }

            this.cargando.set(false);
        }, 1000);
    }
}