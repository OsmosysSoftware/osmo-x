import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, DashboardAnalytics } from '../../core/models/api.model';

export type DashboardSource = 'active' | 'archived' | 'both';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  private readonly _stats = signal<DashboardStats | null>(null);
  readonly stats = this._stats.asReadonly();
  readonly hasStats = computed(() => this._stats() !== null);

  private readonly _analytics = signal<DashboardAnalytics | null>(null);
  readonly analytics = this._analytics.asReadonly();

  loadStats(source: DashboardSource = 'both', period: string = 'all'): Observable<DashboardStats> {
    const params = new HttpParams().set('source', source).set('period', period);

    return this.http
      .get<DashboardStats>(`${this.apiUrl}/stats`, { params })
      .pipe(tap((stats) => this._stats.set(stats)));
  }

  loadAnalytics(
    period: string = '24h',
    source: DashboardSource = 'both',
    applicationId?: number,
  ): Observable<DashboardAnalytics> {
    let params = new HttpParams().set('period', period).set('source', source);

    if (applicationId) {
      params = params.set('application_id', applicationId.toString());
    }

    return this.http
      .get<DashboardAnalytics>(`${this.apiUrl}/analytics`, { params })
      .pipe(tap((analytics) => this._analytics.set(analytics)));
  }
}
