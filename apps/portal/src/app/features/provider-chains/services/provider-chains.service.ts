import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProviderChain,
  CreateProviderChainInput,
  UpdateProviderChainInput,
  PaginatedResponse,
} from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ProviderChainsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/provider-chains`;

  private readonly _providerChains = signal<ProviderChain[]>([]);
  readonly providerChains = this._providerChains.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<ProviderChain>> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http
      .get<PaginatedResponse<ProviderChain>>(this.apiUrl, { params })
      .pipe(tap((res) => this._providerChains.set(res.items)));
  }

  create(data: CreateProviderChainInput): Observable<ProviderChain> {
    return this.http.post<ProviderChain>(this.apiUrl, data);
  }

  update(data: UpdateProviderChainInput): Observable<ProviderChain> {
    return this.http.put<ProviderChain>(this.apiUrl, data);
  }

  delete(chainId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { chain_id: chainId } });
  }
}
