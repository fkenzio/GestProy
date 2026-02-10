import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SubprocesoService {
    private apiUrl = 'http://localhost:5001/api/subprocesos';

    constructor(private http: HttpClient) { }

    listarPorProceso(procesoId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/proceso/${procesoId}`, { headers: this.getHeaders() });
    }

    obtener(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    crear(subproceso: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, subproceso, { headers: this.getHeaders() });
    }

    actualizar(id: number, subproceso: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, subproceso, { headers: this.getHeaders() });
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
