import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class CatalogService {

  private readonly baseUrl = `${environment.apiBaseUrl}/api/catalog`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl);
  }

  crear(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, producto);
  }

  actualizar(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
