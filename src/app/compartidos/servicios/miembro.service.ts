import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MiembroService {
    private apiUrl = 'http://localhost:5001/api/miembros';

    constructor(private http: HttpClient) { }

    listarPorProyecto(proyectoId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/proyecto/${proyectoId}`, { headers: this.getHeaders() });
    }

    asignar(miembro: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, miembro, { headers: this.getHeaders() });
    }

    actualizar(id: number, miembro: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, miembro, { headers: this.getHeaders() });
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
