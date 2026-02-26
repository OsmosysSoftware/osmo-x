import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Organization } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/organizations`;

  private readonly _organizations = signal<Organization[]>([]);
  readonly organizations = this._organizations.asReadonly();

  list(): Observable<Organization[]> {
    return this.http
      .get<Organization[]>(this.apiUrl)
      .pipe(tap((organizations) => this._organizations.set(organizations)));
  }
}
