import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notification, PaginatedResponse } from '../../../core/models/api.model';
import { NotificationFilters } from '../../../core/models/notification-filters.model';

export type { NotificationFilters };

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  private readonly _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  list(
    page = 1,
    limit = 20,
    filters?: NotificationFilters,
  ): Observable<PaginatedResponse<Notification>> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (filters?.channelType) {
      params = params.set('channel_type', filters.channelType);
    }

    if (filters?.deliveryStatus) {
      params = params.set('delivery_status', filters.deliveryStatus);
    }

    if (filters?.applicationId) {
      params = params.set('application_id', filters.applicationId);
    }

    if (filters?.providerId) {
      params = params.set('provider_id', filters.providerId);
    }

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.dateFrom) {
      params = params.set('date_from', filters.dateFrom);
    }

    if (filters?.dateTo) {
      params = params.set('date_to', filters.dateTo);
    }

    if (filters?.sort) {
      params = params.set('sort', filters.sort);
    }

    if (filters?.order) {
      params = params.set('order', filters.order);
    }

    if (filters?.recipient) {
      params = params.set('recipient', filters.recipient);
    }

    if (filters?.sender) {
      params = params.set('sender', filters.sender);
    }

    if (filters?.subject) {
      params = params.set('subject', filters.subject);
    }

    if (filters?.messageBody) {
      params = params.set('message_body', filters.messageBody);
    }

    for (const row of filters?.advancedFilters ?? []) {
      if (row.key && row.value) {
        params = params.append(`data_filter[${row.key}]`, row.value);
      }
    }

    return this.http
      .get<PaginatedResponse<Notification>>(this.apiUrl, { params })
      .pipe(tap((res) => this._notifications.set(res.items)));
  }

  getById(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  redisCleanup(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/redis/cleanup`, {});
  }
}
