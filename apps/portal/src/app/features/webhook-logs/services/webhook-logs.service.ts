import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { WebhookLog, PaginatedResponse } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class WebhookLogsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/webhooks/logs`;
  }

  list(
    webhookId: number,
    page = 1,
    limit = 20,
    notificationId?: number,
  ): Observable<PaginatedResponse<WebhookLog>> {
    let params = new HttpParams().set('webhook_id', webhookId).set('page', page).set('limit', limit);

    if (notificationId) {
      params = params.set('notification_id', notificationId);
    }

    return this.http.get<PaginatedResponse<WebhookLog>>(this.apiUrl, { params });
  }
}
