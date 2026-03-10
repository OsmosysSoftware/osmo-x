import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notification, PaginatedResponse } from '../../../core/models/api.model';

export interface NotificationFilters {
  channel_type?: number;
  delivery_status?: number;
  application_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

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

    if (filters?.channel_type) {
      params = params.set('channel_type', filters.channel_type);
    }

    if (filters?.delivery_status) {
      params = params.set('delivery_status', filters.delivery_status);
    }

    if (filters?.application_id) {
      params = params.set('application_id', filters.application_id);
    }

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.date_from) {
      params = params.set('date_from', filters.date_from);
    }

    if (filters?.date_to) {
      params = params.set('date_to', filters.date_to);
    }

    if (filters?.sort) {
      params = params.set('sort', filters.sort);
    }

    if (filters?.order) {
      params = params.set('order', filters.order);
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
