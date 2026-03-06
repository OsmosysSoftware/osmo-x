import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Webhook,
  CreateWebhookInput,
  UpdateWebhookInput,
  PaginatedResponse,
} from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class WebhooksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/webhooks`;

  private readonly _webhooks = signal<Webhook[]>([]);
  readonly webhooks = this._webhooks.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<Webhook>> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http
      .get<PaginatedResponse<Webhook>>(this.apiUrl, { params })
      .pipe(tap((res) => this._webhooks.set(res.items)));
  }

  create(data: CreateWebhookInput): Observable<Webhook> {
    return this.http.post<Webhook>(this.apiUrl, data);
  }

  update(data: UpdateWebhookInput): Observable<Webhook> {
    return this.http.put<Webhook>(this.apiUrl, data);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { id } });
  }
}
