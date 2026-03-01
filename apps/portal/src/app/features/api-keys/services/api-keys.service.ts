import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ServerApiKey, PaginatedResponse } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/api-keys`;

  private readonly _apiKeys = signal<ServerApiKey[]>([]);
  readonly apiKeys = this._apiKeys.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<ServerApiKey>> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http
      .get<PaginatedResponse<ServerApiKey>>(this.apiUrl, { params })
      .pipe(tap((res) => this._apiKeys.set(res.items)));
  }

  generate(applicationId: number): Observable<string> {
    return this.http.post(this.apiUrl, { application_id: applicationId }, { responseType: 'text' });
  }

  revoke(apiKeyId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { api_key_id: apiKeyId } });
  }
}
