import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse
} from '../models/auth.model';

@Injectable()
export class AuthService {

  apiBaseUrl: string = 'http://127.0.0.1:5000/api/v1.0';

  private readonly TOKEN_KEY: string = 'selection_token';
  private readonly ADMIN_KEY: string = 'selection_admin';

  constructor(private http: HttpClient) { }

  // ============================================================
  //  HTTP — Authentication endpoints
  // ============================================================

  loginCustomer(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.apiBaseUrl + '/guest/login',
      payload
    ).pipe(
      tap((response) => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  loginAdmin(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.apiBaseUrl + '/guest/login',
      payload
    ).pipe(
      map((response) => {
        if (!response.admin) {
          throw new Error('These credentials do not have admin privileges.');
        }
        this.setSession(response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      this.apiBaseUrl + '/guest/register',
      payload
    ).pipe(catchError(this.handleError));
  }

  logout(): Observable<any> {
    return this.http.get<any>(
      this.apiBaseUrl + '/user/logout'
    ).pipe(
      tap(() => this.clearSession()),
      catchError((error: HttpErrorResponse) => {
        this.clearSession();
        return this.handleError(error);
      })
    );
  }

  // ============================================================
  //  LocalStorage — Session management
  // ============================================================

  setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.ADMIN_KEY, String(authResult.admin));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const payload = this.decodeTokenPayload();
    if (!payload) {
      return false;
    }
    return Date.now() < payload.exp * 1000;
  }

  isAdmin(): boolean {
    return this.isLoggedIn() && localStorage.getItem(this.ADMIN_KEY) === 'true';
  }

  getUsername(): string | null {
    const payload = this.decodeTokenPayload();
    return payload?.username ?? null;
  }

  private decodeTokenPayload(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (err) {
      console.warn('[AuthService] Malformed token detected, clearing session.');
      this.clearSession();
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_KEY);
  }

  // ============================================================
  //  Centralised error handler — mirrors ProductService
  // ============================================================

  private handleError(error: HttpErrorResponse | Error) {
    let message = 'An unknown error occurred while contacting the server.';

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        message = 'Network error: ' + error.error.message;
      } else if (error.status === 0) {
        message = 'Cannot reach the SelectionDB API. Is the Flask server running on port 5000?';
      } else if (error.status === 400) {
        message = error.error?.error ?? 'Bad request — please check the data you submitted.';
      } else if (error.status === 401) {
        message = error.error?.error ?? 'Invalid credentials. Please try again.';
      } else if (error.status === 403) {
        message = 'Forbidden — you do not have permission for this action.';
      } else if (error.status === 404) {
        message = 'The authentication endpoint could not be reached.';
      } else if (error.status >= 500) {
        message = 'The server encountered an internal error. Please try again later.';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error('[AuthService] error:', error);
    return throwError(() => new Error(message));
  }
}