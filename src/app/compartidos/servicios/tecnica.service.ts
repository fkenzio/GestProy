import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TecnicaService {
    private apiUrl = 'http://localhost:5001/api/tecnicas';
    private apiUrlAsignaciones = 'http://localhost:5001/api/subproceso-tecnicas';

    constructor(private http: HttpClient) { }

    listar(categoria?: string): Observable<any[]> {
        const url = categoria ? `${this.apiUrl}?categoria=${categoria}` : this.apiUrl;
        return this.http.get<any[]>(url, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    listarPorSubproceso(subprocesoId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrlAsignaciones}/subproceso/${subprocesoId}`, { headers: this.getHeaders() });
    }

    asignar(asignacion: any): Observable<any> {
        return this.http.post<any>(this.apiUrlAsignaciones, asignacion, { headers: this.getHeaders() });
    }

    actualizarAsignacion(id: number, asignacion: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrlAsignaciones}/${id}`, asignacion, { headers: this.getHeaders() });
    }

    eliminarAsignacion(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrlAsignaciones}/${id}`, { headers: this.getHeaders() });
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }
}
