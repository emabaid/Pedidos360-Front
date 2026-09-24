import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { CatalogService } from '../core/services/catalog.service';
import { OrdersService } from '../core/services/orders.service';
import { EstadoPedido, Pedido, TRANSICIONES_VALIDAS } from '../core/models/pedido';
import { Producto } from '../core/models/producto';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="tarjeta">
      <h2>Pedidos</h2>

      <p *ngIf="cargando()">Cargando pedidos...</p>
      <p *ngIf="error()" class="error">{{ error() }}</p>

      <!-- Crear pedido: disponible para los tres roles -->
      <div class="formulario">
        <h3>Nuevo pedido</h3>

        <label>
          Producto
          <select [(ngModel)]="itemNuevo.productoId" name="productoId">
            <option [ngValue]="null" disabled>Selecciona un producto</option>
            <option *ngFor="let producto of productos()" [ngValue]="producto.id">
              {{ producto.nombre }} (stock: {{ producto.stock }})
            </option>
          </select>
        </label>

        <label>
          Cantidad
          <input type="number" min="1" [(ngModel)]="itemNuevo.cantidad" name="cantidad" />
        </label>

        <button (click)="agregarItem()">Agregar al pedido</button>

        <ul *ngIf="itemsPedido().length > 0">
          <li *ngFor="let item of itemsPedido()">
            Producto #{{ item.productoId }} x {{ item.cantidad }}
          </li>
        </ul>

        <button *ngIf="itemsPedido().length > 0" (click)="crearPedido()">
          Confirmar pedido
        </button>
      </div>

      <h3>{{ esClienteSolo() ? 'Mis pedidos' : 'Todos los pedidos' }}</h3>

      <table *ngIf="!cargando() && pedidos().length > 0" class="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th *ngIf="!esClienteSolo()">Cliente</th>
            <th>Estado</th>
            <th>Items</th>
            <th *ngIf="esOperador()">Cambiar estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let pedido of pedidos()">
            <td>{{ pedido.id }}</td>
            <td *ngIf="!esClienteSolo()">{{ pedido.clienteUsername }}</td>
            <td>{{ pedido.estado }}</td>
            <td>
              <span *ngFor="let item of pedido.items">
                {{ item.productoNombre }} x{{ item.cantidad }};
              </span>
            </td>
            <td *ngIf="esOperador()">
              <ng-container *ngIf="siguientesEstados(pedido.estado).length > 0">
                <select #selectorEstado>
                  <option *ngFor="let estado of siguientesEstados(pedido.estado)" [value]="estado">
                    {{ estado }}
                  </option>
                </select>
                <button (click)="cambiarEstado(pedido, selectorEstado.value)">
                  Aplicar
                </button>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="!cargando() && pedidos().length === 0">No hay pedidos para mostrar.</p>
    </section>
  `
})
export class Orders implements OnInit {

  readonly pedidos = signal<Pedido[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly itemsPedido = signal<{ productoId: number; cantidad: number }[]>([]);

  itemNuevo: { productoId: number | null; cantidad: number } = { productoId: null, cantidad: 1 };

  constructor(
    private ordersService: OrdersService,
    private catalogService: CatalogService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.catalogService.listar().subscribe({ next: (p) => this.productos.set(p) });
    this.cargarPedidos();
  }

  esClienteSolo(): boolean {
    return this.authService.tieneRol('CLIENTE')
      && !this.authService.tieneRol('OPERADOR')
      && !this.authService.tieneRol('ADMINISTRADOR');
  }

  esOperador(): boolean {
    return this.authService.tieneRol('OPERADOR');
  }

  siguientesEstados(estado?: EstadoPedido): EstadoPedido[] {
    if (!estado) return [];
    return TRANSICIONES_VALIDAS[estado] ?? [];
  }

  cargarPedidos(): void {
    this.cargando.set(true);

    this.ordersService.listar().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudieron cargar los pedidos.'));
        this.cargando.set(false);
      }
    });
  }

  agregarItem(): void {
    if (!this.itemNuevo.productoId || this.itemNuevo.cantidad < 1) {
      return;
    }

    this.itemsPedido.update(items => [
      ...items,
      { productoId: this.itemNuevo.productoId!, cantidad: this.itemNuevo.cantidad }
    ]);

    this.itemNuevo = { productoId: null, cantidad: 1 };
  }

  crearPedido(): void {
    const pedido: Pedido = {
      items: this.itemsPedido()
    };

    this.ordersService.crear(pedido).subscribe({
      next: () => {
        this.itemsPedido.set([]);
        this.cargarPedidos();
      },
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo crear el pedido.'))
    });
  }

  cambiarEstado(pedido: Pedido, nuevoEstado: string): void {
    this.ordersService.cambiarEstado(pedido.id!, nuevoEstado as EstadoPedido).subscribe({
      next: () => this.cargarPedidos(),
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo cambiar el estado.'))
    });
  }

  private mensajeError(err: any, fallback: string): string {
    if (err?.status === 401) return 'Tu sesión expiró o el token no es válido.';
    if (err?.status === 403) return 'No tienes permisos para realizar esta acción.';
    if (err?.status === 409) return err?.error ?? 'Regla de negocio inválida (ej: transición de estado no permitida).';
    return fallback;
  }
}
