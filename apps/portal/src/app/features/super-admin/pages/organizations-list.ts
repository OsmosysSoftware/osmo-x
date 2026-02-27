import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrganizationsService } from '../services/organizations.service';
import { Organization } from '../../../core/models/api.model';

@Component({
  selector: 'app-organizations-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations-list.html',
  styleUrl: './organizations-list.scss',
})
export class OrganizationsListComponent implements OnInit {
  private readonly service = inject(OrganizationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly dt = viewChild<Table>('dt');

  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingOrg = signal<Organization | null>(null);
  readonly formName = signal('');
  readonly formSlug = signal('');

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading.set(true);

    this.service.list().subscribe({
      next: (organizations) => {
        this.organizations.set(organizations);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load organizations',
        });
        this.loading.set(false);
      },
    });
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreate(): void {
    this.editingOrg.set(null);
    this.formName.set('');
    this.formSlug.set('');
    this.dialogVisible.set(true);
  }

  openEdit(org: Organization): void {
    this.editingOrg.set(org);
    this.formName.set(org.name);
    this.formSlug.set(org.slug);
    this.dialogVisible.set(true);
  }

  onNameChange(name: string): void {
    this.formName.set(name);

    // Auto-generate slug only when creating
    if (!this.editingOrg()) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      this.formSlug.set(slug);
    }
  }

  isFormValid(): boolean {
    const name = this.formName().trim();
    const slug = this.formSlug().trim();

    if (!name || !slug) {
      return false;
    }

    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  save(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingOrg();

    if (editing) {
      this.service
        .update({
          organization_id: editing.organization_id,
          name: this.formName().trim(),
          slug: this.formSlug().trim(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Updated',
              detail: `Organization "${this.formName().trim()}" updated successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadOrganizations();
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.service
        .create({
          name: this.formName().trim(),
          slug: this.formSlug().trim(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: `Organization "${this.formName().trim()}" created successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadOrganizations();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  confirmDelete(org: Organization): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${org.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(org.organization_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Organization "${org.name}" deleted successfully`,
            });
            this.loadOrganizations();
          },
        });
      },
    });
  }
}
