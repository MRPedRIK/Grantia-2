import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoginResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(this.restoreUser());
  constructor(private readonly http: HttpClient) {}

  private restoreUser(): User | null {
    try {
      return sessionStorage.getItem('token')
        ? JSON.parse(sessionStorage.getItem('user') || 'null') as User | null
        : null;
    } catch { return null; }
  }
  get token(): string | null { return sessionStorage.getItem('token'); }
  async login(email: string, password: string): Promise<void> {
    const result = await firstValueFrom(this.http.post<LoginResponse>('/api/login', { email, password }));
    sessionStorage.setItem('token', result.token);
    sessionStorage.setItem('user', JSON.stringify(result.user));
    this.user.set(result.user);
  }
  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.user.set(null);
  }
}