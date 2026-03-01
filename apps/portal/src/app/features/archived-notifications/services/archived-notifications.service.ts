import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ArchivedNotification, PaginatedResponse } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ArchivedNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/archived-notifications`;

  private readonly _archivedNotifications = signal<ArchivedNotification[]>([]);
  readonly archivedNotifications = this._archivedNotifications.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<ArchivedNotification>> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http
      .get<PaginatedResponse<ArchivedNotification>>(this.apiUrl, { params })
      .pipe(tap((res) => this._archivedNotifications.set(res.items)));
  }

  getById(id: number): Observable<ArchivedNotification> {
    return this.http.get<ArchivedNotification>(`${this.apiUrl}/${id}`);
  }
}
