import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { CatalogService } from '../core/services/catalog.service';
import { Producto } from '../core/models/producto';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="tarjeta">
      <h2>Catálogo de productos</h2>

      <p *ngIf="cargando()">Cargando productos...</p>
      <p *ngIf="error()" class="error">{{ error() }}</p>

      <table *ngIf="!cargando() && productos().length > 0" class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Stock</th>
            <th *ngIf="esOperador()">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let producto of productos()">
            <td>{{ producto.nombre }}</td>
            <td>{{ producto.descripcion }}</td>
            <td>&#36;{{ producto.precio }}</td>
            <td>{{ producto.stock }}</td>
            <td *ngIf="esOperador()">
              <button (click)="editar(producto)">Editar</button>
              <button class="secundario" (click)="eliminar(producto)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="!cargando() && productos().length === 0">No hay productos cargados todavía.</p>

      <div *ngIf="esOperador()" class="formulario">
        <h3>{{ editando() ? 'Editar producto' : 'Nuevo producto' }}</h3>

        <label>
          Nombre
          <input [(ngModel)]="formulario.nombre" name="nombre" />
        </label>

        <label>
          Descripción
          <input [(ngModel)]="formulario.descripcion" name="descripcion" />
        </label>

        <label>
          Precio
          <input type="number" [(ngModel)]="formulario.precio" name="precio" min="0" />
        </label>

        <label>
          Stock
          <input type="number" [(ngModel)]="formulario.stock" name="stock" min="0" />
        </label>

        <div class="acciones">
          <button (click)="guardar()">{{ editando() ? 'Guardar cambios' : 'Crear producto' }}</button>
          <button *ngIf="editando()" class="secundario" (click)="cancelarEdicion()">Cancelar</button>
        </div>
      </div>
    </section>
  `
})
export class Catalog implements OnInit {

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly editando = signal<Producto | null>(null);

  formulario: Producto = this.formularioVacio();

  constructor(
    private catalogService: CatalogService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  esOperador(): boolean {
    return this.authService.tieneRol('OPERADOR');
  }

  cargar(): void {
    this.cargando.set(true);
    this.catalogService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'No se pudo cargar el catálogo.'));
        this.cargando.set(false);
      }
    });
  }

  editar(producto: Producto): void {
    this.editando.set(producto);
    this.formulario = { ...producto };
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.formulario = this.formularioVacio();
  }

  guardar(): void {
    const enEdicion = this.editando();

    const operacion = enEdicion
      ? this.catalogService.actualizar(enEdicion.id!, this.formulario)
      : this.catalogService.crear(this.formulario);

    operacion.subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargar();
      },
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo guardar el producto.'))
    });
  }

  eliminar(producto: Producto): void {
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) {
      return;
    }

    this.catalogService.eliminar(producto.id!).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(this.mensajeError(err, 'No se pudo eliminar el producto.'))
    });
  }

  private mensajeError(err: any, fallback: string): string {
    if (err?.status === 401) return 'Tu sesión expiró o el token no es válido.';
    if (err?.status === 403) return 'No tienes permisos para realizar esta acción.';
    return fallback;
  }

  private formularioVacio(): Producto {
    return { nombre: '', descripcion: '', precio: 0, stock: 0 };
  }
}
