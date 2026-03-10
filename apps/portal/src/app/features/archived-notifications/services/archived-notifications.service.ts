import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ArchivedNotification, PaginatedResponse } from '../../../core/models/api.model';

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
export class ArchivedNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/archived-notifications`;

  private readonly _archivedNotifications = signal<ArchivedNotification[]>([]);
  readonly archivedNotifications = this._archivedNotifications.asReadonly();

  list(
    page = 1,
    limit = 20,
    filters?: NotificationFilters,
  ): Observable<PaginatedResponse<ArchivedNotification>> {
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
      .get<PaginatedResponse<ArchivedNotification>>(this.apiUrl, { params })
      .pipe(tap((res) => this._archivedNotifications.set(res.items)));
  }

  getById(id: number): Observable<ArchivedNotification> {
    return this.http.get<ArchivedNotification>(`${this.apiUrl}/${id}`);
  }
}
