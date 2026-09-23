import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router';

import {
  MsalBroadcastService,
  MsalService
} from '@azure/msal-angular';

import {
  AccountInfo,
  AuthenticationResult,
  InteractionStatus
} from '@azure/msal-browser';

import { Subject } from 'rxjs';

import {
  filter,
  takeUntil
} from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',

  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet
  ],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App
  implements OnInit, OnDestroy {

  user: AccountInfo | null = null;

  private readonly destroying$ =
    new Subject<void>();

  constructor(
    private authServiceMsal: MsalService,
    private msalBroadcastService:
      MsalBroadcastService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Procesa el regreso desde Microsoft Entra ID.
    this.authServiceMsal
      .handleRedirectObservable({
        navigateToLoginRequestUrl: false
      })
      .subscribe({

        next: (
          result:
            AuthenticationResult | null
        ) => {

          if (result?.account) {

            this.authServiceMsal.instance
              .setActiveAccount(
                result.account
              );

            // Recién aquí sabemos que el login se completó de verdad,
            // así que navegamos manualmente (no con un redirect automático
            // de rutas, que dispararía el guard antes de que el usuario
            // alcance a hacer clic en "Iniciar sesión").
            this.router.navigate(['/dashboard']);
          }
        },

        error: (error) => {

          console.error(
            'Error MSAL:',
            error
          );
        }
      });

    // Angular 21 + MSAL: esperar hasta que finalice la interacción
    // antes de consultar/actualizar la cuenta activa.
    this.msalBroadcastService
      .inProgress$
      .pipe(

        filter(
          (
            status:
              InteractionStatus
          ) =>
            status ===
            InteractionStatus.None
        ),

        takeUntil(
          this.destroying$
        )
      )
      .subscribe(() => {

        this.actualizarUsuario();

      });
  }

  private actualizarUsuario(): void {

    let activeAccount =
      this.authServiceMsal.instance
        .getActiveAccount();

    const accounts =
      this.authServiceMsal.instance
        .getAllAccounts();

    if (
      !activeAccount &&
      accounts.length > 0
    ) {

      activeAccount =
        accounts[0];

      this.authServiceMsal.instance
        .setActiveAccount(
          activeAccount
        );
    }

    this.user =
      activeAccount ?? null;

    if (this.user) {
      // Precarga los roles del access token apenas hay sesión activa,
      // para que dashboard/catalog/orders ya los tengan disponibles.
      this.authService.refrescarRoles();

      // Si ya había sesión (ej. recargaste la página) y estamos en la
      // raíz, avanza directo al dashboard en vez de dejar la pantalla vacía.
      if (this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      }
    }

    // Necesario para reflejar explícitamente cambios de estado
    // en la aplicación Angular 21 zoneless utilizada en el laboratorio.
    this.cdr.markForCheck();
  }

  login(): void {

    this.authServiceMsal
      .loginRedirect({
        scopes: [
          'openid',
          'profile',
          'email'
        ]
      });
  }

  logout(): void {

    this.authServiceMsal
      .logoutRedirect({
        postLogoutRedirectUri:
          'http://localhost:4200'
      });
  }

  ngOnDestroy(): void {

    this.destroying$.next();
    this.destroying$.complete();
  }
}
