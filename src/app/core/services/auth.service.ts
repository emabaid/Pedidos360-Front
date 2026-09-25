import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Rol = 'ADMINISTRADOR' | 'OPERADOR' | 'CLIENTE';

/**
 * Los App Roles de Entra ID (ROLE_ADMINISTRADOR, ROLE_OPERADOR, ROLE_CLIENTE)
 * se asignaron sobre la App Registration de la API, así que solo aparecen en
 * el claim "roles" del ACCESS TOKEN pedido con el scope de la API — no en el
 * ID Token del login. Por eso este servicio pide ese access token y decodifica
 * su payload para saber qué puede ver/hacer el usuario en el frontend.
 *
 * Esto es solo para adaptar la UI (mostrar/ocultar botones). La autorización
 * real y obligatoria ocurre en el BFF con @PreAuthorize, nunca solo aquí.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly rolesSubject = new BehaviorSubject<Rol[]>([]);
  readonly roles$ = this.rolesSubject.asObservable();

  constructor(private msalService: MsalService) {}

  async refrescarRoles(): Promise<Rol[]> {
    const account = this.msalService.instance.getActiveAccount();
    if (!account) {
      this.rolesSubject.next([]);
      return [];
    }

    try {
      const resultado = await this.msalService.instance.acquireTokenSilent({
        account,
        scopes: [environment.msal.apiScope]
      });

      const roles = this.extraerRoles(resultado.accessToken);
      this.rolesSubject.next(roles);
      return roles;
    } catch (error) {
      console.error('No se pudieron obtener los roles del access token:', error);
      this.rolesSubject.next([]);
      return [];
    }
  }

  get rolesActuales(): Rol[] {
    return this.rolesSubject.value;
  }

  tieneRol(rol: Rol): boolean {
    return this.rolesActuales.includes(rol);
  }

  tieneAlgunRol(roles: Rol[]): boolean {
    return roles.some(r => this.rolesActuales.includes(r));
  }

  private extraerRoles(accessToken: string): Rol[] {
    try {
      const payloadBase64 = accessToken.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      console.log('[DEBUG access token payload]', payload);

      const rolesClaim: string[] = payload['roles'] ?? [];

      return rolesClaim
        .map(r => r.replace('ROLE_', ''))
        .filter((r): r is Rol => ['ADMINISTRADOR', 'OPERADOR', 'CLIENTE'].includes(r));
    } catch (error) {
      console.error('Error decodificando el access token:', error);
      return [];
    }
  }
}
