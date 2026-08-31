import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CurrentUser, LoginResponse, PermissionCode } from './authentication';

interface StoredSession {
  accessToken: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly storageKey = 'ris.auth.session';
  private readonly accessTokenState = signal<string | null>(null);
  private readonly expiresAtState = signal<string | null>(null);
  private readonly currentUserState = signal<CurrentUser | null>(null);
  private readonly expiredSubject = new Subject<void>();
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentUser = this.currentUserState.asReadonly();
  readonly expired = this.expiredSubject.asObservable();

  constructor() {
    this.restoreStoredToken();
  }

  start(response: LoginResponse): void {
    this.accessTokenState.set(response.accessToken);
    this.expiresAtState.set(response.expiresAt);
    this.currentUserState.set(response.user);
    this.writeStoredSession({
      accessToken: response.accessToken,
      expiresAt: response.expiresAt,
    });
    this.scheduleExpiration(response.expiresAt);
  }

  setCurrentUser(user: CurrentUser): void {
    this.currentUserState.set(user);
  }

  accessToken(): string | null {
    const token = this.accessTokenState();
    const expiresAt = this.expiresAtState();
    if (!token || !expiresAt || !this.isFuture(expiresAt)) {
      this.clear();
      return null;
    }
    return token;
  }

  hasPermission(permission: PermissionCode): boolean {
    return this.currentUserState()?.permissions.includes(permission) ?? false;
  }

  clear(): void {
    if (this.expirationTimer !== null) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.accessTokenState.set(null);
    this.expiresAtState.set(null);
    this.currentUserState.set(null);
    this.removeStoredSession();
  }

  private restoreStoredToken(): void {
    const stored = this.readStoredSession();
    if (!stored || !this.isFuture(stored.expiresAt)) {
      this.removeStoredSession();
      return;
    }
    this.accessTokenState.set(stored.accessToken);
    this.expiresAtState.set(stored.expiresAt);
    this.scheduleExpiration(stored.expiresAt);
  }

  private scheduleExpiration(expiresAt: string): void {
    if (this.expirationTimer !== null) clearTimeout(this.expirationTimer);
    const delay = Math.max(0, Date.parse(expiresAt) - Date.now());
    this.expirationTimer = setTimeout(() => {
      this.clear();
      this.expiredSubject.next();
    }, delay);
  }

  private isFuture(value: string): boolean {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp > Date.now();
  }

  private readStoredSession(): StoredSession | null {
    try {
      const value = globalThis.sessionStorage?.getItem(this.storageKey);
      if (!value) return null;
      const parsed = JSON.parse(value) as Partial<StoredSession>;
      if (typeof parsed.accessToken !== 'string' || typeof parsed.expiresAt !== 'string') {
        return null;
      }
      return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt };
    } catch {
      return null;
    }
  }

  private writeStoredSession(session: StoredSession): void {
    try {
      globalThis.sessionStorage?.setItem(this.storageKey, JSON.stringify(session));
    } catch {
      // The in-memory session still works when browser storage is unavailable.
    }
  }

  private removeStoredSession(): void {
    try {
      globalThis.sessionStorage?.removeItem(this.storageKey);
    } catch {
      // Nothing else is required when browser storage is unavailable.
    }
  }
}
