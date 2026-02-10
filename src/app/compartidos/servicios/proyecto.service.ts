import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProyectoService {
    private apiUrl = 'http://localhost:5001/api/proyectos';

    constructor(private http: HttpClient) { }

    listar(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    crear(proyecto: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, proyecto, { headers: this.getHeaders() });
    }

    actualizar(id: number, proyecto: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, proyecto, { headers: this.getHeaders() });
    }

    eliminar(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }
}
