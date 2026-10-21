import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AssetDetails, AssetInput, MovementInput, User, UserInput } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}
  asset(patrimony: string): Promise<AssetDetails> {
    return firstValueFrom(this.http.get<AssetDetails>('/api/assets/' + encodeURIComponent(patrimony.trim())));
  }
  createAsset(input: AssetInput): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/assets', input));
  }
  createUser(input: UserInput): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/users', input));
  }
  technicians(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>('/api/users'));
  }
  movement(input: MovementInput): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/assets/movement', input));
  }
}
export function humanError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Sem conexão com o servidor. Confira a rede e tente novamente.';
    return typeof error.error?.error === 'string' ? error.error.error : 'Falha ao comunicar com o servidor.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}