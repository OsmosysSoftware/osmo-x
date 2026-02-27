import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Webhook } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class WebhooksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/webhooks`;

  private readonly _webhooks = signal<Webhook[]>([]);
  readonly webhooks = this._webhooks.asReadonly();

  list(providerId: number): Observable<Webhook[]> {
    const params = new HttpParams().set('provider_id', providerId);

    return this.http
      .get<Webhook[]>(this.apiUrl, { params })
      .pipe(tap((webhooks) => this._webhooks.set(webhooks)));
  }

  create(data: { webhook_url: string; provider_id: number }): Observable<Webhook> {
    return this.http.post<Webhook>(this.apiUrl, data);
  }

  update(data: { id: number; webhook_url: string }): Observable<Webhook> {
    return this.http.put<Webhook>(this.apiUrl, data);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { id } });
  }
}
