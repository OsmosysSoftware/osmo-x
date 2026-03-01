import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { OrganizationsService } from '../../features/super-admin/services/organizations.service';
import { Organization } from '../models/api.model';

const STORAGE_KEY = 'org_context_selected_org_id';

@Injectable({ providedIn: 'root' })
export class OrgContextService {
  private readonly authService = inject(AuthService);
  private readonly orgsService = inject(OrganizationsService);

  private readonly _selectedOrgId = signal<number | null>(this.loadFromStorage());

  readonly showOrgSelector = computed(() => this.authService.isSuperAdmin());

  readonly organizations = computed<Organization[]>(() => this.orgsService.organizations());

  readonly effectiveOrgId = computed<number | null>(() => {
    if (!this.authService.isSuperAdmin()) {
      return null;
    }

    return this._selectedOrgId();
  });

  /**
   * True when SUPER_ADMIN has "All Organizations" selected (no specific org).
   * CRUD pages should disable create/edit/delete when this is true.
   */
  readonly isAllOrgsMode = computed<boolean>(
    () => this.authService.isSuperAdmin() && this._selectedOrgId() === null,
  );

  readonly selectedOrgName = computed<string | null>(() => {
    const orgId = this._selectedOrgId();

    if (!orgId) return null;

    const org = this.organizations().find((o) => o.organization_id === orgId);

    return org?.name ?? null;
  });

  constructor() {
    effect(() => {
      const orgId = this._selectedOrgId();

      if (orgId !== null) {
        sessionStorage.setItem(STORAGE_KEY, String(orgId));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  loadOrganizations(): void {
    if (!this.authService.isSuperAdmin()) return;

    this.orgsService.list().subscribe();
  }

  selectOrg(orgId: number | null): void {
    this._selectedOrgId.set(orgId);
  }

  private loadFromStorage(): number | null {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    return stored ? Number(stored) : null;
  }
}
