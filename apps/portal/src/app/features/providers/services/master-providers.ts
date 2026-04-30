import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { MasterProvider } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class MasterProvidersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/master-providers`;
  }

  list(): Observable<MasterProvider[]> {
    return this.http.get<MasterProvider[]>(this.apiUrl);
  }
}
