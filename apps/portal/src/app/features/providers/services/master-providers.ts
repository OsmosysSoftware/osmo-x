import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MasterProvider } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class MasterProvidersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/master-providers`;

  list(): Observable<MasterProvider[]> {
    return this.http.get<MasterProvider[]>(this.apiUrl);
  }
}
