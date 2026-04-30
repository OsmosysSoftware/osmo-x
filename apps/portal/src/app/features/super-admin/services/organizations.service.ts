import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/organizations`;
  }

  private readonly _organizations = signal<Organization[]>([]);
  readonly organizations = this._organizations.asReadonly();

  list(): Observable<Organization[]> {
    return this.http
      .get<Organization[]>(this.apiUrl)
      .pipe(tap((organizations) => this._organizations.set(organizations)));
  }

  create(data: CreateOrganizationInput): Observable<Organization> {
    return this.http.post<Organization>(this.apiUrl, data);
  }

  update(data: UpdateOrganizationInput): Observable<Organization> {
    return this.http.put<Organization>(this.apiUrl, data);
  }

  delete(organizationId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, {
      body: { organization_id: organizationId },
    });
  }
}
