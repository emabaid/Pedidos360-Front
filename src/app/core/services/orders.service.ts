import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoPedido, Pedido } from '../models/pedido';

@Injectable({ providedIn: 'root' })
export class OrdersService {

  private readonly baseUrl = `${environment.apiBaseUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.baseUrl);
  }

  listarMios(): Observable<Pedido[]> {
    // El BFF ignora cualquier "usuario" que mandemos y usa el del JWT,
    // pero el endpoint igual requiere el query param por consistencia con orders.
    return this.http.get<Pedido[]>(`${this.baseUrl}/mios`, { params: { usuario: 'yo' } });
  }

  crear(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.baseUrl, pedido);
  }

  cambiarEstado(id: number, nuevoEstado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.baseUrl}/${id}/estado`, { nuevoEstado });
  }
}
