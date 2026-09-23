import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService, Rol } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="tarjeta">
      <h2>Hola, {{ nombre() }}</h2>

      <p *ngIf="roles().length === 0">
        No se encontraron App Roles asignados para tu usuario en Entra ID.
        Pide a un administrador que te asigne ROLE_ADMINISTRADOR, ROLE_OPERADOR
        o ROLE_CLIENTE en la Enterprise Application de la API.
      </p>

      <ul *ngIf="roles().length > 0">
        <li *ngFor="let rol of roles()">Rol activo: <strong>{{ rol }}</strong></li>
      </ul>

      <div class="acciones">
        <a class="boton enlace" routerLink="/catalog">Ver catálogo</a>
        <a class="boton enlace" routerLink="/orders">Ver pedidos</a>
      </div>

      <div class="resumen" *ngIf="tieneRolOperadorOAdmin()">
        <h3>Resumen para {{ tieneRol('OPERADOR') ? 'Operador' : 'Administrador' }}</h3>
        <p>Desde "Ver pedidos" puedes revisar todos los pedidos de los clientes.</p>
        <p *ngIf="tieneRol('OPERADOR')">
          Como Operador también puedes crear/editar productos, administrar stock
          y cambiar el estado de los pedidos.
        </p>
      </div>

      <div class="resumen" *ngIf="tieneRol('CLIENTE')">
        <h3>Resumen para Cliente</h3>
        <p>Desde "Ver pedidos" puedes crear un nuevo pedido y revisar el estado de los tuyos.</p>
      </div>
    </section>
  `
})
export class Dashboard implements OnInit {

  readonly roles = signal<Rol[]>([]);
  readonly nombre = signal<string>('');

  constructor(
    private authService: AuthService,
    private msalService: MsalService
  ) {}

  async ngOnInit(): Promise<void> {
    const account = this.msalService.instance.getActiveAccount();
    this.nombre.set(account?.name ?? account?.username ?? 'usuario');

    const roles = await this.authService.refrescarRoles();
    this.roles.set(roles);
  }

  tieneRol(rol: Rol): boolean {
    return this.roles().includes(rol);
  }

  tieneRolOperadorOAdmin(): boolean {
    return this.tieneRol('OPERADOR') || this.tieneRol('ADMINISTRADOR');
  }
}
