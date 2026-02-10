import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RolService {
    private apiUrl = 'http://localhost:5001/api/roles';

    constructor(private http: HttpClient) { }

    listar(proyectoId?: number): Observable<any[]> {
        const url = proyectoId ? `${this.apiUrl}?proyecto_id=${proyectoId}` : this.apiUrl;
        return this.http.get<any[]>(url, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    crear(rol: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, rol, { headers: this.getHeaders() });
    }

    actualizar(id: number, rol: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, rol, { headers: this.getHeaders() });
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
