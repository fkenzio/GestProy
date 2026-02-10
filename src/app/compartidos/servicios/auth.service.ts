import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:5001/api/auth';

    constructor(private http: HttpClient) { }

    registro(datos: { nombre: string; apellido: string; correo: string; contrasena: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, datos).pipe(
            tap((res: any) => {
                if (res.access_token) {
                    localStorage.setItem('token', res.access_token);
                    localStorage.setItem('refresh_token', res.refresh_token);
                }
            })
        );
    }

    login(correo: string, contrasena: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { correo, contrasena }).pipe(
            tap((res: any) => {
                if (res.access_token) {
                    localStorage.setItem('token', res.access_token);
                    localStorage.setItem('refresh_token', res.refresh_token);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getUsuarioActual(): Observable<any> {
        return this.http.get(`${this.apiUrl}/me`, { headers: this.getHeaders() });
    }

    private getHeaders(): HttpHeaders {
        const token = this.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }
}
