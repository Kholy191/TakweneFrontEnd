import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthClient } from '../api/api-clients';
import { Session } from './session';

const STORAGE_KEY = 'takwene.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient = inject(AuthClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(readStoredSession());
  private refreshInFlight$: Observable<string> | null = null;

  readonly isLoggedIn = computed(() => !!this.session()?.user);
  readonly isAdmin = computed(() => this.session()?.user?.isAdmin ?? false);
  readonly artistId = computed(() => this.session()?.user?.artistId ?? null);
  readonly email = computed(() => this.session()?.email ?? '');
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly hasRefreshToken = computed(() => !!this.session()?.refreshToken);

  // Logs in, then asks the API who we are (roles, artist link) instead of decoding the JWT.
  login(email: string, password: string): Observable<void> {
    return this.authClient.login({ email, password }).pipe(
      tap((tokens) =>
        this.save({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          email: tokens.email,
          user: null,
        }),
      ),
      switchMap(() => this.authClient.getCurrentUser()),
      tap((user) => this.update({ user })),
      map(() => undefined),
      catchError((error) => {
        this.clear();
        return throwError(() => error);
      }),
    );
  }

  // One refresh at a time; concurrent 401s wait for the same call.
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.session()?.refreshToken;
    if (!refreshToken) return throwError(() => new Error('No refresh token.'));

    this.refreshInFlight$ ??= this.authClient.refreshToken({ refreshToken }).pipe(
      map((tokens) => {
        this.update({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
        return tokens.accessToken;
      }),
      finalize(() => (this.refreshInFlight$ = null)),
      shareReplay(1),
    );
    return this.refreshInFlight$;
  }

  logout(): void {
    const refreshToken = this.session()?.refreshToken;
    this.expireSession();

    // Best effort: the local session is already gone even if this call fails.
    if (refreshToken) this.authClient.logout({ refreshToken }).subscribe({ error: () => undefined });
  }

  expireSession(): void {
    this.clear();
    void this.router.navigateByUrl('/login');
  }

  private save(session: Session): void {
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private update(changes: Partial<Session>): void {
    const current = this.session();
    if (current) this.save({ ...current, ...changes });
  }

  private clear(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function readStoredSession(): Session | null {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Session | null;
    return session?.accessToken && session.user ? session : null;
  } catch {
    return null;
  }
}
