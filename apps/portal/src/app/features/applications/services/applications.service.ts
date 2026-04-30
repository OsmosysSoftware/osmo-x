import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import {
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  PaginatedResponse,
} from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/applications`;
  }

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

  create(data: CreateApplicationInput): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, data);
  }

  update(data: UpdateApplicationInput): Observable<Application> {
    return this.http.put<Application>(this.apiUrl, data);
  }

  delete(applicationId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { application_id: applicationId } });
  }
}
