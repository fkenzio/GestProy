import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EjecucionService {
    private apiUrl = 'http://localhost:5001/api/ejecuciones';

    constructor(private http: HttpClient) { }

    listarPorTecnica(subprocesoTecnicaId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/tecnica/${subprocesoTecnicaId}`, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    crear(ejecucion: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, ejecucion, { headers: this.getHeaders() });
    }

    actualizar(id: number, ejecucion: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, ejecucion, { headers: this.getHeaders() });
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
