import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RequerimientoService {
    private apiUrl = 'http://localhost:5001/api/requerimientos';

    constructor(private http: HttpClient) { }

    listarPorSubproceso(subprocesoId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/subproceso/${subprocesoId}`, { headers: this.getHeaders() });
    }

    listarPorTecnica(subprocesoTecnicaId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/tecnica/${subprocesoTecnicaId}`, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    crear(requerimiento: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, requerimiento, { headers: this.getHeaders() });
    }

    actualizar(id: number, requerimiento: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, requerimiento, { headers: this.getHeaders() });
    }

    eliminar(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    agregarCriterio(requerimientoId: number, criterio: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${requerimientoId}/criterios`, criterio, { headers: this.getHeaders() });
    }

    actualizarCriterio(criterioId: number, criterio: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/criterios/${criterioId}`, criterio, { headers: this.getHeaders() });
    }

    eliminarCriterio(criterioId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/criterios/${criterioId}`, { headers: this.getHeaders() });
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }
}
