import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DiagramaService {
    private apiUrl = 'http://localhost:5001/api/diagramas';

    constructor(private http: HttpClient) { }

    listarPorProyecto(proyectoId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/proyecto/${proyectoId}`, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    crear(diagrama: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, diagrama, { headers: this.getHeaders() });
    }

    actualizar(id: number, datos: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, datos, { headers: this.getHeaders() });
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
