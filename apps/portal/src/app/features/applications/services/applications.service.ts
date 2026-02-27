import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Application, PaginatedResponse } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/applications`;

  private readonly _applications = signal<Application[]>([]);
  readonly applications = this._applications.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<Application>> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http
      .get<PaginatedResponse<Application>>(this.apiUrl, { params })
      .pipe(tap((res) => this._applications.set(res.items)));
  }

  getById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}`);
  }

  create(data: { name: string; test_mode_enabled?: boolean }): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, {
      name: data.name,
      test_mode_enabled: data.test_mode_enabled ? 1 : 0,
    });
  }

  update(data: {
    application_id: number;
    name?: string;
    test_mode_enabled?: boolean;
  }): Observable<Application> {
    return this.http.put<Application>(this.apiUrl, {
      ...data,
      test_mode_enabled: data.test_mode_enabled ? 1 : 0,
    });
  }

  delete(applicationId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { application_id: applicationId } });
  }
}
