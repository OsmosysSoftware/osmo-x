import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ServerApiKey } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/api-keys`;

  private readonly _apiKeys = signal<ServerApiKey[]>([]);
  readonly apiKeys = this._apiKeys.asReadonly();

  list(applicationId: number): Observable<ServerApiKey[]> {
    const params = new HttpParams().set('application_id', applicationId);

    return this.http
      .get<ServerApiKey[]>(this.apiUrl, { params })
      .pipe(tap((keys) => this._apiKeys.set(keys)));
  }

  generate(applicationId: number): Observable<string> {
    return this.http.post<string>(this.apiUrl, { application_id: applicationId });
  }
}
