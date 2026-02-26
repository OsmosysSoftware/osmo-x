import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_applications: number;
  total_providers: number;
  total_notifications: number;
  successful_notifications: number;
  failed_notifications: number;
  pending_notifications: number;
  success_rate: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/dashboard`;

  private readonly _stats = signal<DashboardStats | null>(null);
  readonly stats = this._stats.asReadonly();
  readonly hasStats = computed(() => this._stats() !== null);

  loadStats(): Observable<DashboardStats> {
    return this.http
      .get<DashboardStats>(`${this.apiUrl}/stats`)
      .pipe(tap((stats) => this._stats.set(stats)));
  }
}
