import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { OrgContextService } from '../../../core/services/org-context.service';

@Component({
  selector: 'app-org-selector',
  imports: [SelectModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (orgContext.showOrgSelector()) {
      <p-select
        [options]="orgContext.organizations()"
        [ngModel]="orgContext.effectiveOrgId()"
        (ngModelChange)="onOrgChange($event)"
        optionLabel="name"
        optionValue="organization_id"
        placeholder="All Organizations"
        [showClear]="true"
        [filter]="true"
        filterPlaceholder="Search orgs..."
        appendTo="body"
        styleClass="w-56"
      />
    }
  `,
})
export class OrgSelectorComponent implements OnInit {
  readonly orgContext = inject(OrgContextService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.orgContext.loadOrganizations();
  }

  onOrgChange(orgId: number | null): void {
    this.orgContext.selectOrg(orgId);

    // Re-navigate current route to refresh data
    const currentUrl = this.router.url;

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }
}
