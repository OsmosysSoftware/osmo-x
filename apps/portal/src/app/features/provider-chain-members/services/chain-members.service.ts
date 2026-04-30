import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import {
  ProviderChainMember,
  CreateProviderChainMemberInput,
  UpdateProviderPriorityOrderInput,
  DeleteProviderChainMemberInput,
  PaginatedResponse,
} from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ChainMembersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/provider-chain-members`;
  }

  private readonly _members = signal<ProviderChainMember[]>([]);
  readonly members = this._members.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<ProviderChainMember>> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http
      .get<PaginatedResponse<ProviderChainMember>>(this.apiUrl, { params })
      .pipe(tap((res) => this._members.set(res.items)));
  }

  listByChain(chainId: number): Observable<PaginatedResponse<ProviderChainMember>> {
    const params = new HttpParams().set('chain_id', chainId).set('limit', 100);

    return this.http.get<PaginatedResponse<ProviderChainMember>>(this.apiUrl, { params });
  }

  create(data: CreateProviderChainMemberInput): Observable<ProviderChainMember> {
    return this.http.post<ProviderChainMember>(this.apiUrl, data);
  }

  updatePriorityOrder(data: UpdateProviderPriorityOrderInput): Observable<ProviderChainMember[]> {
    return this.http.put<ProviderChainMember[]>(`${this.apiUrl}/priority-order`, data);
  }

  delete(data: DeleteProviderChainMemberInput): Observable<ProviderChainMember> {
    return this.http.delete<ProviderChainMember>(this.apiUrl, { body: data });
  }

  restore(data: DeleteProviderChainMemberInput): Observable<ProviderChainMember> {
    return this.http.put<ProviderChainMember>(`${this.apiUrl}/restore`, data);
  }
}
