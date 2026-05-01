import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import {
  Provider,
  CreateProviderInput,
  UpdateProviderInput,
  PaginatedResponse,
} from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ProvidersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/providers`;
  }

  private readonly _providers = signal<Provider[]>([]);
  readonly providers = this._providers.asReadonly();

  list(page = 1, limit = 20, applicationId?: number): Observable<PaginatedResponse<Provider>> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (applicationId) {
      params = params.set('application_id', applicationId);
    }

    return this.http
      .get<PaginatedResponse<Provider>>(this.apiUrl, { params })
      .pipe(tap((res) => this._providers.set(res.items)));
  }

  getById(id: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateProviderInput): Observable<Provider> {
    return this.http.post<Provider>(this.apiUrl, data);
  }

  update(data: UpdateProviderInput): Observable<Provider> {
    return this.http.put<Provider>(this.apiUrl, data);
  }

  delete(providerId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { provider_id: providerId } });
  }
}
