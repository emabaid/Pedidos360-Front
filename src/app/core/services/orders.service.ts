import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoPedido, Pedido } from '../models/pedido';

@Injectable({ providedIn: 'root' })
export class OrdersService {

  private readonly baseUrl = `${environment.apiBaseUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Una sola llamada para todos los roles: el BFF decide, mirando el token,
   * si devuelve todos los pedidos (Administrador/Operador) o solo los del
   * Cliente autenticado. El frontend ya no elige el endpoint según el rol.
   */
  listar(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.baseUrl);
  }

  crear(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.baseUrl, pedido);
  }

  cambiarEstado(id: number, nuevoEstado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.baseUrl}/${id}/estado`, { nuevoEstado });
  }
}
