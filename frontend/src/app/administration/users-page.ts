import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AccountStatusDialog } from './account-status-dialog';
import { RolesDialog } from './roles-dialog';
import { ManagedUser, ROLE_OPTIONS, RoleCode } from './user-management';
import { UserManagementApi } from './user-management-api';
import { UserFormDialog } from './user-form-dialog';

@Component({
  selector: 'app-users-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <header>
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Staff accounts</h1>
        <p>Manage access using the RIS fixed roles. Accounts are disabled rather than deleted.</p>
      </div>
      <button mat-flat-button type="button" (click)="openCreate()">
        <mat-icon svgIcon="person_add"></mat-icon>Create account
      </button>
    </header>
    @if (error()) {
      <mat-card appearance="outlined" class="error-card" role="alert"
        ><mat-card-content
          >{{ error() }}
          <button mat-button type="button" (click)="load()">Try again</button></mat-card-content
        ></mat-card
      >
    }
    @if (loading()) {
      <div class="state">
        <mat-spinner diameter="42" />
        <p>Loading staff accounts…</p>
      </div>
    } @else if (!error() && users().length === 0) {
      <mat-card appearance="outlined" class="state"
        ><mat-card-content
          ><mat-icon svgIcon="group"></mat-icon>
          <h2>No staff accounts</h2>
          <p>Create the first account to get started.</p></mat-card-content
        ></mat-card
      >
    } @else if (users().length > 0) {
      <mat-card appearance="outlined" class="table-card"
        ><div class="table-scroll">
          <table mat-table [dataSource]="users()">
            <ng-container matColumnDef="user"
              ><th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let user">
                <strong>{{ user.displayName }}</strong
                ><small>{{ user.username }}</small>
              </td></ng-container
            >
            <ng-container matColumnDef="roles"
              ><th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip-set aria-label="Assigned roles">
                  @for (role of user.roles; track role) {
                    <mat-chip>{{ roleLabel(role) }}</mat-chip>
                  }
                </mat-chip-set>
              </td></ng-container
            >
            <ng-container matColumnDef="status"
              ><th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let user">
                <span class="status" [class.disabled]="!user.enabled"
                  ><span></span>{{ user.enabled ? 'Enabled' : 'Disabled' }}</span
                >
              </td></ng-container
            >
            <ng-container matColumnDef="updatedAt"
              ><th mat-header-cell *matHeaderCellDef>Updated</th>
              <td mat-cell *matCellDef="let user">
                {{ user.updatedAt | date: 'dd MMM yyyy, HH:mm' }}
              </td></ng-container
            >
            <ng-container matColumnDef="actions"
              ><th mat-header-cell *matHeaderCellDef>
                <span class="visually-hidden">Actions</span>
              </th>
              <td mat-cell *matCellDef="let user" class="actions">
                <button mat-stroked-button type="button" (click)="openRoles(user)">
                  <mat-icon svgIcon="manage_accounts"></mat-icon>Edit roles</button
                ><button
                  mat-button
                  type="button"
                  [class.warn]="user.enabled"
                  (click)="openStatus(user)"
                >
                  {{ user.enabled ? 'Disable' : 'Enable' }}
                </button>
              </td></ng-container
            >
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table></div
      ></mat-card>
      <p class="account-count">
        {{ users().length }} staff {{ users().length === 1 ? 'account' : 'accounts' }}
      </p>
    }
  `,
  styles: [
    `
      header {
        align-items: start;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }
      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }
      header p:not(.eyebrow) {
        color: var(--ris-text-secondary);
        margin: 0;
      }
      .eyebrow {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        letter-spacing: 0.04em;
        margin: 0 0 0.35rem;
        text-transform: uppercase;
      }
      .table-card {
        overflow: hidden;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        min-width: 880px;
        width: 100%;
      }
      td strong,
      td small {
        display: block;
      }
      td small {
        color: var(--ris-text-secondary);
        margin-top: 0.2rem;
      }
      .status {
        align-items: center;
        display: inline-flex;
        gap: 0.45rem;
      }
      .status span {
        background: #2e7d32;
        border-radius: 50%;
        height: 8px;
        width: 8px;
      }
      .status.disabled span {
        background: #757575;
      }
      .actions {
        text-align: right;
        white-space: nowrap;
      }
      .actions button + button {
        margin-left: 0.5rem;
      }
      .warn {
        color: var(--mat-sys-error);
      }
      .state {
        align-items: center;
        display: flex;
        flex-direction: column;
        padding: 4rem 1rem;
        text-align: center;
      }
      .state mat-icon {
        height: 48px;
        width: 48px;
      }
      .error-card {
        border-color: var(--mat-sys-error);
        color: var(--mat-sys-error);
      }
      .account-count {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-body-small);
      }
      .visually-hidden {
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
      }
      @media (max-width: 700px) {
        header {
          align-items: stretch;
          flex-direction: column;
        }
        header button {
          align-self: start;
        }
      }
    `,
  ],
})
export class UsersPage {
  private readonly api = inject(UserManagementApi);
  private readonly dialog = inject(MatDialog);
  readonly users = signal<ManagedUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly columns = ['user', 'roles', 'status', 'updatedAt', 'actions'];
  private readonly roleLabels = new Map<RoleCode, string>(
    ROLE_OPTIONS.map((role) => [role.value, role.label]),
  );
  constructor() {
    this.load();
  }
  roleLabel(role: RoleCode) {
    return this.roleLabels.get(role) ?? role;
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Staff accounts could not be loaded.');
        this.loading.set(false);
      },
    });
  }
  openCreate() {
    this.dialog
      .open(UserFormDialog, { width: '560px' })
      .afterClosed()
      .subscribe((user?: ManagedUser) => {
        if (user) this.upsert(user);
      });
  }
  openRoles(user: ManagedUser) {
    this.dialog
      .open(RolesDialog, { data: user, width: '480px' })
      .afterClosed()
      .subscribe((updated?: ManagedUser) => {
        if (updated) this.upsert(updated);
      });
  }
  openStatus(user: ManagedUser) {
    this.dialog
      .open(AccountStatusDialog, { data: user, width: '440px' })
      .afterClosed()
      .subscribe((updated?: ManagedUser) => {
        if (updated) this.upsert(updated);
      });
  }
  private upsert(user: ManagedUser) {
    this.users.update((users) =>
      [...users.filter((item) => item.id !== user.id), user].sort((a, b) =>
        a.username.localeCompare(b.username),
      ),
    );
  }
}
