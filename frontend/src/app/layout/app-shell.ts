import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthSession } from '../authentication/auth-session';
import { AuthenticationApi } from '../authentication/authentication-api';
import { PermissionCode } from '../authentication/authentication';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  permission?: PermissionCode;
}

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authentication = inject(AuthenticationApi);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSession);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 959px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  private readonly allNavigation: NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Patients', icon: 'group', route: '/patients', permission: 'PATIENT_READ' },
    { label: 'Exams', icon: 'assignment', route: '/exams', permission: 'EXAM_READ' },
    { label: 'Worklist', icon: 'view_list', route: '/worklist', permission: 'WORKLIST_READ' },
    { label: 'Reports', icon: 'description', route: '/reports', permission: 'REPORT_READ' },
    {
      label: 'Administration',
      icon: 'manage_accounts',
      route: '/admin/users',
      permission: 'USER_MANAGE',
    },
  ];

  readonly currentUser = this.session.currentUser;
  readonly navigation = computed(() =>
    this.allNavigation.filter(
      (item) => !item.permission || this.session.hasPermission(item.permission),
    ),
  );
  readonly roleLabel = computed(() =>
    (this.currentUser()?.roles ?? [])
      .map((role) => role.charAt(0) + role.slice(1).toLowerCase())
      .join(', '),
  );

  constructor() {
    this.session.expired.pipe(takeUntilDestroyed()).subscribe(() => {
      void this.router.navigate(['/login'], { queryParams: { sessionExpired: true } });
    });
  }

  closeMobileNavigation(drawer: MatSidenav): void {
    if (this.isMobile()) {
      drawer.close();
    }
  }

  logout(): void {
    this.authentication.logout();
    void this.router.navigate(['/login']);
  }
}
